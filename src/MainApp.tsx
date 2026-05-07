/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useRef } from 'react';

import { getUserAccount, useAuthenticated, useUserSettings } from '@zextras/carbonio-shell-ui';

import CounterBadgeUpdater from './chats/components/CounterBadgeUpdater';
import RegisterCreationButton from './chats/components/RegisterCreationButton';
import RegisterVirtualRoomCreationButton from './chats/components/RegisterVirtualRoomCreationButton';
import initChats from './chats/initChats';
import initIntegrations from './integrations/initIntegrations';
import MeetingNotificationHandler from './meetings/components/MeetingNotificationsHandler';
import initMeetings from './meetings/initMeetings';
import { ChatApi, getToken, listMeetings, listRooms } from './network';
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

	// NETWORKS: detect backend type, then load inbox accordingly
	const connect = useCallback(() => {
		getToken()
			.then((resp) => {
				// Detect backend type: attempt XMPP connection with a 3 s timeout.
				// CONNECTED  → MongooseIM backend (devel mode)
				// CONNFAIL / AUTHFAIL / ERROR / timeout → common-socket backend
				xmppClient.connectAsync(resp.zmToken, 3000).then((isMongoose: boolean) => {
					useStore.getState().setIsMongooseIM(isMongoose);

					if (isMongoose) {
						// ===== MONGOOSEIM PATH =====
						// Rooms loaded via REST; XMPP already connected above and will fill
						// the inbox via setInbox() inside XMPPConnection.connectionEstablish().
						// WebSocket carries room-level events (typing, markers, etc.).
						Promise.all([listRooms(), listMeetings()])
							.then(() => {
								setChatsBeStatus(true);
								const { wsClient } = useStore.getState().connections;
								wsClient?.connect();
							})
							.catch(() => setChatsBeStatus(false));
					} else {
						// ===== COMMON-SOCKET PATH =====
						// Connect WS immediately — independent of inbox/meetings loading
						const { wsClient } = useStore.getState().connections;
						wsClient?.connect();

						// Load inbox and meetings in parallel; failures must NOT kill WS connection
						Promise.all([ChatApi.getInbox(), listMeetings()])
							.then(([inboxResponse]) => {
								const { addRooms, newInboxMessage, setUnreadCount } = useStore.getState();

								const conversations = inboxResponse?.conversations ?? [];
								const rooms = conversations.map((conv) => conv.room);
								addRooms(rooms);

								// Fetch initial presence for all room members
								const allMemberIds: string[] = [];
								rooms.forEach((room) => {
									if (room.members) {
										room.members.forEach((m: { userId: string }) => {
											if (!allMemberIds.includes(m.userId)) {
												allMemberIds.push(m.userId);
											}
										});
									}
								});
								if (allMemberIds.length > 0) {
									const { setUserPresence } = useStore.getState();
									const BATCH_SIZE = 500;
									const presenceBatches: string[][] = [];
									for (let i = 0; i < allMemberIds.length; i += BATCH_SIZE) {
										presenceBatches.push(allMemberIds.slice(i, i + BATCH_SIZE));
									}
									Promise.all(presenceBatches.map((batch) => ChatApi.getPresenceBatch(batch)))
										.then((results) => {
											results.forEach((result) => {
												Object.entries(result).forEach(([userId, { online, lastActivity }]) => {
													setUserPresence(userId, online, lastActivity);
												});
											});
										})
										.catch((err) => {
											console.error('[MainApp] Presence batch fetch failed:', err);
										});
								}

								// Helper: SystemEventType → OperationType
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

								// Helper: extract actorId / memberId from event content
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

								// Helper: compute read status from API markers
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
									if (!apiMarkers || apiMarkers.length === 0 || !members)
										return MarkerStatus.UNREAD;

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

								// Process conversations: unread counts, markers, last message/event
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

									const msgDate = conv.lastMessage
										? dateToTimestamp(conv.lastMessage.createdAt)
										: 0;
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

								setChatsBeStatus(true);
							})
							.catch((err) => {
								console.error('[MainApp] inbox/meetings init failed', err);
								setChatsBeStatus(false);
							});
					}
				});
			})
			.catch((err) => {
				console.error('[MainApp] getToken failed', err);
				setChatsBeStatus(false);
			});
	}, [setChatsBeStatus]);

	useEffect(() => {
		if (authenticated && !hasConnectedRef.current) {
			hasConnectedRef.current = true;
			connect();
		}

		// Cleanup: disconnect WebSocket when leaving
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
