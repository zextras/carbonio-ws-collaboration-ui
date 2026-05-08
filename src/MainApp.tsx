/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useRef } from 'react';

import { getUserAccount, useAuthenticated, useUserSettings } from '@zextras/carbonio-shell-ui';
import { gte } from 'semver';

import CounterBadgeUpdater from './chats/components/CounterBadgeUpdater';
import RegisterCreationButton from './chats/components/RegisterCreationButton';
import RegisterVirtualRoomCreationButton from './chats/components/RegisterVirtualRoomCreationButton';
import initChats from './chats/initChats';
import initIntegrations from './integrations/initIntegrations';
import MeetingNotificationHandler from './meetings/components/MeetingNotificationsHandler';
import initMeetings from './meetings/initMeetings';
import { ChatApi, getCapabilities, getToken, listMeetings, listRooms } from './network';
import { xmppClient } from './network/xmpp/XMPPClient';
import WaitingListSnackbar from './settings/components/WaitingListSnackbar';
import initSettings from './settings/initSettings';
import useStore from './store/Store';
import { SystemEventType } from './types/network/models/chatTypes';
import {
	MessageType,
	MarkerStatus,
	TextMessage,
	ConfigurationMessage,
	OperationType,
	Marker
} from './types/store/ChatsRegistryTypes';
import { setDateDefault, dateToTimestamp, isBefore } from './utils/dateUtils';

export default function MainApp(): React.JSX.Element {
	const setLoginInfo = useStore((state) => state.setLoginInfo);
	const setAttributes = useStore((state) => state.setAttributes);
	const setChatsBeStatus = useStore((state) => state.setChatsBeStatus);
	const setSupportedVersions = useStore((state) => state.setSupportedVersions);

	const authenticated = useAuthenticated();
	const { prefs, attrs } = useUserSettings();
	const hasConnectedRef = useRef(false);

	useEffect(() => {
		setSupportedVersions([
			'1.7.0',
			'1.6.10',
			'1.6.9',
			'1.6.8',
			'1.6.7',
			'1.6.6',
			'1.6.5',
			'1.6.4',
			'1.6.3',
			'1.6.2',
			'1.6.1',
			'1.6.0'
		]);
	}, [setSupportedVersions]);

	// STORE: init with user session main infos
	useEffect(() => {
		const userAccount = getUserAccount();
		if (authenticated && userAccount) {
			setLoginInfo({
				id: userAccount.id,
				name: userAccount.name,
				displayName: userAccount.displayName
			});
			setAttributes(attrs);
		}
	}, [setLoginInfo, authenticated, setAttributes, attrs]);

	// SET TIMEZONE and LOCALE
	useEffect(() => {
		if (authenticated) setDateDefault(prefs?.zimbraPrefLocale);
	}, [prefs, authenticated]);

	// NETWORKS: detect backend type via /inbox, then load accordingly
	const connect = useCallback(() => {
		getToken()
			.then((resp) => {
				// Detect backend type: try /inbox first.
				// 200 → common-socket backend (inbox data reused, XMPP never touched)
				// 404 / network error → MongooseIM backend
				ChatApi.getInbox()
					.then((inboxResponse) => {
						// ===== COMMON-SOCKET PATH =====
						useStore.getState().setIsMongooseIM(false);

						const { wsClient } = useStore.getState().connections;
						wsClient?.connect();

						const { addRooms, newInboxMessage, setUnreadCount } = useStore.getState();

						const conversations = inboxResponse?.conversations ?? [];
						const rooms = conversations.map((conv) => conv.room);
						addRooms(rooms);

						const { setUserPresence } = useStore.getState();
						rooms.forEach((room) => {
							room.members?.forEach((m) => {
								if (m.online !== undefined) {
									setUserPresence(m.userId, m.online, m.lastActivity);
								}
							});
						});

						const mapEventTypeToOperation = (eventType: SystemEventType): OperationType => {
							switch (eventType) {
								case 'ROOM_CREATED':
									return OperationType.ROOM_CREATION;
								case 'MEMBER_ADDED':
									return OperationType.MEMBER_ADDED;
								case 'MEMBER_REMOVED':
									return OperationType.MEMBER_REMOVED;
								case 'MEETING_STARTED':
									return OperationType.MEETING_STARTED;
								case 'MEETING_ENDED':
									return OperationType.MEETING_ENDED;
								case 'MEETING_DECLINED':
									return OperationType.MEETING_DECLINED;
								default:
									return OperationType.ROOM_CREATION;
							}
						};

						const extractEventActorAndMember = (
							eventType: SystemEventType,
							content: Record<string, unknown> | undefined
						): { actorId: string; memberId: string } => {
							if (!content) return { actorId: '', memberId: '' };
							switch (eventType) {
								case 'ROOM_CREATED':
									return {
										actorId: (content.creatorId as string) || '',
										memberId: ''
									};
								case 'MEMBER_ADDED': {
									const addedUserIds = content.addedUserIds as string[] | undefined;
									return {
										actorId: (content.addedByUserId as string) || '',
										memberId: addedUserIds?.[0] || ''
									};
								}
								case 'MEMBER_REMOVED':
									return {
										actorId: (content.removedByUserId as string) || '',
										memberId: (content.removedUserId as string) || ''
									};
								case 'MEETING_STARTED':
									return {
										actorId: (content.startedBy as string) || '',
										memberId: ''
									};
								case 'MEETING_ENDED':
									return {
										actorId: (content.endedBy as string) || '',
										memberId: String(content.durationSec ?? '')
									};
								case 'MEETING_DECLINED':
									return {
										actorId: (content.declinedBy as string) || '',
										memberId: ''
									};
								default:
									return { actorId: '', memberId: '' };
							}
						};

						const calcReadStatusFromMarkers = (
							messageId: string,
							messageDate: number,
							senderId: string,
							apiMarkers:
								| Array<{
										userId: string;
										messageId: string;
										readAt: string;
								  }>
								| undefined,
							members: Array<{ userId: string }> | undefined,
							sessionId: string | undefined
						): MarkerStatus => {
							if (senderId !== sessionId) return MarkerStatus.UNREAD;
							if (!apiMarkers || apiMarkers.length === 0 || !members) return MarkerStatus.UNREAD;

							const readByCount = apiMarkers.filter((marker) => {
								if (marker.userId === sessionId) return false;
								const markerDate = dateToTimestamp(marker.readAt);
								return isBefore(messageDate, markerDate) || marker.messageId === messageId;
							}).length;

							const otherMembersCount = members.filter((m) => m.userId !== sessionId).length;

							if (readByCount >= otherMembersCount && otherMembersCount > 0)
								return MarkerStatus.READ;
							if (readByCount > 0) return MarkerStatus.READ_BY_SOMEONE;
							return MarkerStatus.UNREAD;
						};

						const { session } = useStore.getState();
						const sessionId = session.id;

						conversations.forEach((conv) => {
							setUnreadCount(conv.roomId, conv.unreadCount);

							if (conv.markers && conv.markers.length > 0) {
								const { updateReadStatus } = useStore.getState();
								const storeMarkers: Marker[] = conv.markers.map((m) => ({
									from: m.userId,
									messageId: m.messageId,
									markerDate: dateToTimestamp(m.readAt),
									type: 'displayed' as const
								}));
								updateReadStatus(conv.roomId, storeMarkers);
							}

							const msgDate = conv.lastMessage ? dateToTimestamp(conv.lastMessage.createdAt) : 0;
							const eventDate = conv.lastEvent ? dateToTimestamp(conv.lastEvent.createdAt) : 0;

							if (msgDate >= eventDate && conv.lastMessage) {
								const msg = conv.lastMessage;
								const readStatus = calcReadStatusFromMarkers(
									msg.id,
									dateToTimestamp(msg.createdAt),
									msg.senderId,
									conv.markers,
									conv.room.members,
									sessionId
								);
								const textMessage: TextMessage = {
									id: msg.id,
									stanzaId: msg.id,
									roomId: msg.roomId,
									date: dateToTimestamp(msg.createdAt),
									type: MessageType.TEXT_MSG,
									from: msg.senderId,
									text: msg.text || msg.attachment?.name || '',
									read: readStatus,
									forwardedInfo: msg.forwardedInfo,
									editedInfo: msg.editedInfo,
									deletedInfo: msg.deletedInfo,
									attachment: msg.attachment
										? {
												id: msg.attachment.id,
												name: msg.attachment.name,
												mimeType: msg.attachment.mimeType,
												size: msg.attachment.size
											}
										: undefined
								};
								newInboxMessage(textMessage);
							} else if (conv.lastEvent) {
								const evt = conv.lastEvent;
								const { actorId, memberId } = extractEventActorAndMember(
									evt.type,
									evt.content as Record<string, unknown> | undefined
								);
								const configMessage: ConfigurationMessage = {
									id: evt.id,
									roomId: conv.roomId,
									date: dateToTimestamp(evt.createdAt),
									type: MessageType.CONFIGURATION_MSG,
									operation: mapEventTypeToOperation(evt.type),
									value: memberId,
									from: actorId,
									read: MarkerStatus.UNREAD
								};
								newInboxMessage(configMessage);
							}
						});

						listMeetings().catch(() => {});
						setChatsBeStatus(true);
					})
					.catch(() => {
						// ===== MONGOOSEIM PATH =====
						useStore.getState().setIsMongooseIM(true);

						Promise.all([listRooms(true, true), listMeetings()])
							.then(() => {
								const version = useStore.getState().session.apiVersion;
								if (version && gte(version, '1.6.8')) {
									getCapabilities().catch(() => {
										setAttributes(attrs);
									});
								} else {
									setAttributes(attrs);
								}
								setChatsBeStatus(true);
								xmppClient.connect(resp.zmToken);
								const { wsClient } = useStore.getState().connections;
								wsClient?.connect();
							})
							.catch(() => setChatsBeStatus(false));
					});
			})
			.catch((err) => {
				console.error('[MainApp] getToken failed', err);
				setChatsBeStatus(false);
			});
	}, [setChatsBeStatus, setAttributes, attrs]);

	useEffect(() => {
		if (!authenticated) {
			hasConnectedRef.current = false;
			const { wsClient: ws } = useStore.getState().connections;
			ws?.disconnect();
			useStore.getState().reset();
			localStorage.removeItem('carbonio-ws-collaboration-storage');
			return undefined;
		}

		if (!hasConnectedRef.current) {
			hasConnectedRef.current = true;
			connect();
		}

		const handleBeforeUnload = (): void => {
			const { wsClient: ws } = useStore.getState().connections;
			ws?.disconnect();
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return (): void => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			if (authenticated) {
				const { wsClient: ws } = useStore.getState().connections;
				ws?.disconnect();
			}
		};
	}, [authenticated, connect]);

	initChats();
	initMeetings();
	initSettings();
	initIntegrations();

	return (
		<>
			<RegisterCreationButton />
			<RegisterVirtualRoomCreationButton />
			<CounterBadgeUpdater />
			<MeetingNotificationHandler />
			<WaitingListSnackbar />
		</>
	);
}
