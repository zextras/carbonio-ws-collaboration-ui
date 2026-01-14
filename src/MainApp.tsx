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
import PresenceApi from './network/apis/PresenceApi';
import ChatSseClient from './network/sse/ChatSseClient';
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
import { setDateDefault, dateToTimestamp } from './utils/dateUtils';

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
			setLoginInfo(userAccount.id, userAccount.name, userAccount.displayName, UserType.INTERNAL);
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

						// Process last messages/events and unread counts
						inboxResponse.conversations.forEach((conv) => {
							// Set unread count for each room
							setUnreadCount(conv.roomId, conv.unreadCount);

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
								const textMessage: TextMessage = {
									id: msg.id,
									stanzaId: msg.id,
									roomId: msg.roomId,
									date: dateToTimestamp(msg.createdAt),
									type: MessageType.TEXT_MSG,
									from: msg.senderId,
									text: msg.text || msg.attachment?.name || '',
									read: MarkerStatus.UNREAD,
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
								const configMessage: ConfigurationMessage = {
									id: evt.id,
									roomId: conv.roomId,
									date: dateToTimestamp(evt.createdAt),
									type: MessageType.CONFIGURATION_MSG,
									operation: mapEventTypeToOperation(evt.type),
									value: (evt.content?.memberId as string) || '',
									from: (evt.content?.actorId as string) || '',
									read: MarkerStatus.UNREAD
								};
								newInboxMessage(configMessage);
							}
						});

						setChatsBeStatus(true);
						// Init SSE client and webSocket after inbox request to avoid missing data
						const { wsClient } = useStore.getState().connections;
						ChatSseClient.connect();
						wsClient.connect();
						// Start presence polling (sends heartbeats to stay online)
						PresenceApi.startPolling().catch((error) => {
							console.error('[MainApp] Error starting presence polling:', error);
						});
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

		// Cleanup: disconnect SSE and stop presence polling when leaving
		const handleBeforeUnload = (): void => {
			PresenceApi.stopPolling();
			ChatSseClient.disconnect();
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return (): void => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			if (authenticated) {
				PresenceApi.stopPolling();
				ChatSseClient.disconnect();
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
