/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect } from 'react';

import { getUserAccount, useAuthenticated, useUserSettings } from '@zextras/carbonio-shell-ui';

import CounterBadgeUpdater from './chats/components/CounterBadgeUpdater';
import RegisterCreationButton from './chats/components/RegisterCreationButton';
import RegisterVirtualRoomCreationButton from './chats/components/RegisterVirtualRoomCreationButton';
import initChats from './chats/initChats';
import initIntegrations from './integrations/initIntegrations';
import MeetingNotificationHandler from './meetings/components/MeetingNotificationsHandler';
import initMeetings from './meetings/initMeetings';
import { MeetingsApi, InfoApi } from './network';
import ChatApi from './network/apis/ChatApi';
import WaitingListSnackbar from './settings/components/WaitingListSnackbar';
import initSettings from './settings/initSettings';
import useStore from './store/Store';
import {
	MessageType,
	MarkerStatus,
	TextMessage,
	ConfigurationMessage,
	OperationType
} from './types/store/ChatsRegistryTypes';
import { SystemEventType } from './types/network/models/chatTypes';
import { UserType } from './types/store/UserTypes';
import { setDateDefault, dateToTimestamp, isBefore } from './utils/dateUtils';
import { Marker } from './types/store/ChatsRegistryTypes';

export default function MainApp(): React.JSX.Element {
	const setLoginInfo = useStore((state) => state.setLoginInfo);
	const setAttributes = useStore((state) => state.setAttributes);
	const setChatsBeStatus = useStore((state) => state.setChatsBeStatus);
	const setSupportedVersions = useStore((state) => state.setSupportedVersions);

	const authenticated = useAuthenticated();
	const { prefs, attrs } = useUserSettings();

	useEffect(() => {
		setSupportedVersions(['1.6.5', '1.6.4', '1.6.3', '1.6.2', '1.6.1', '1.6.0']);
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

	// NETWORKS: init SSE and WebSocket clients (for meetings)
	const connect = useCallback(() => {
		InfoApi.getToken()
			.then(() => {
				Promise.all([ChatApi.getInbox(), MeetingsApi.listMeetings()])
					.then(([inboxResponse]) => {
						// Process inbox response - extract rooms and add them
						const { addRooms, newInboxMessage, setUnreadCount } = useStore.getState();

						// Extract rooms from inbox conversations and add to store
						const rooms = inboxResponse.conversations.map((conv) => conv.room);
						addRooms(rooms);

						// Helper to map SystemEventType to OperationType
						const mapEventTypeToOperation = (
							eventType: SystemEventType
						): OperationType => {
							switch (eventType) {
								case 'ROOM_CREATED':
									return OperationType.ROOM_CREATION;
								case 'MEMBER_ADDED':
									return OperationType.MEMBER_ADDED;
								case 'MEMBER_REMOVED':
									return OperationType.MEMBER_REMOVED;
								default:
									return OperationType.ROOM_CREATION;
							}
						};

						// Helper to extract actorId and memberId from event content based on type
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
								default:
									return { actorId: '', memberId: '' };
							}
						};

						// Helper to convert API markers to store format and calculate read status
						const calcReadStatusFromMarkers = (
							messageId: string,
							messageDate: number,
							senderId: string,
							apiMarkers: Array<{ userId: string; messageId: string; readAt: string }> | undefined,
							members: Array<{ userId: string }> | undefined,
							sessionId: string
						): MarkerStatus => {
							// Only show checkmarks for messages sent by the current user
							if (senderId !== sessionId) {
								return MarkerStatus.UNREAD;
							}

							if (!apiMarkers || apiMarkers.length === 0 || !members) {
								return MarkerStatus.UNREAD;
							}

							// Count how many OTHER users have read this message
							const readByCount = apiMarkers.filter((marker) => {
								// Skip our own marker
								if (marker.userId === sessionId) return false;
								// Check if the marker points to this message or a later one
								const markerDate = dateToTimestamp(marker.readAt);
								return isBefore(messageDate, markerDate) || marker.messageId === messageId;
							}).length;

							// Calculate total other members (excluding ourselves)
							const otherMembersCount = members.filter(
								(m) => m.userId !== sessionId
							).length;

							if (readByCount >= otherMembersCount && otherMembersCount > 0) {
								return MarkerStatus.READ;
							} else if (readByCount > 0) {
								return MarkerStatus.READ_BY_SOMEONE;
							}
							return MarkerStatus.UNREAD;
						};

						// Get session ID
						const { session } = useStore.getState();
						const sessionId = session.id;

						// Process last messages/events and unread counts
						inboxResponse.conversations.forEach((conv) => {
							// Set unread count for each room
							setUnreadCount(conv.roomId, conv.unreadCount);

							// Store markers in the registry for this room
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

							// Determine which is more recent: lastMessage or lastEvent
							const msgDate = conv.lastMessage
								? dateToTimestamp(conv.lastMessage.createdAt)
								: 0;
							const eventDate = conv.lastEvent
								? dateToTimestamp(conv.lastEvent.createdAt)
								: 0;

							// Add the most recent item (message or event) to chat registry
							if (msgDate >= eventDate && conv.lastMessage) {
								const msg = conv.lastMessage;
								// Calculate read status using markers
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
						// Init WebSocket after inbox request to avoid missing data
						// Presence is handled by WebSocket connection lifecycle (no polling needed)
						const { wsClient } = useStore.getState().connections;
						wsClient.connect();
					})
					.catch(() => setChatsBeStatus(false));
			})
			.catch(() => {
				setChatsBeStatus(false);
			});
	}, [setChatsBeStatus]);

	useEffect(() => {
		if (authenticated) {
			connect();
		}

		// Cleanup: disconnect WebSocket when leaving
		const handleBeforeUnload = (): void => {
			const { wsClient: ws } = useStore.getState().connections;
			ws.disconnect();
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return (): void => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			if (authenticated) {
				const { wsClient: ws } = useStore.getState().connections;
				ws.disconnect();
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
