/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';

import ShimmeringConversationView from './shimmerViews/ShimmeringConversationView';
import ShimmeringInfoPanelView from './shimmerViews/ShimmeringInfoPanelView';
import ChatApi from '../../network/apis/ChatApi';
import { mapTimelineItemsToMessages } from '../../network/sse/utilities/messageMapper';
import { getUserId } from '../../store/selectors/SessionSelectors';
import { getRoomTypeSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import Conversation from '../components/conversation/Conversation';

const RoomView = (): ReactElement => {
	// Retrieve room id from url
	const { roomId } = useParams();
	const selectedRoomId: string = useMemo(
		() => (roomId ? decodeURIComponent(roomId) : ''),
		[roomId]
	);

	const setSelectedRoom = useStore((state) => state.setSelectedRoom);
	const roomType = useStore((store) => getRoomTypeSelector(store, selectedRoomId));
	const currentUserId = useStore(getUserId);
	const newMessage = useStore((store) => store.newMessage);
	const setHistoryLoadDisabled = useStore((store) => store.setHistoryLoadDisabled);

	// Keep selectedRoom update
	useEffect(() => {
		setSelectedRoom(selectedRoomId);
	}, [selectedRoomId, setSelectedRoom]);

	// Load initial timeline when entering a chat
	const loadInitialTimeline = useCallback(async () => {
		if (!selectedRoomId || !currentUserId) return;

		// Skip API call for placeholder rooms (room doesn't exist yet)
		if (selectedRoomId.startsWith('placeholder-')) return;

		// Check if messages are already loaded for this room
		const store = useStore.getState();
		const existingMessages = store.chatsRegistry[selectedRoomId]?.messages;
		if (existingMessages && existingMessages.length > 0) {
			// Messages already loaded, skip
			return;
		}

		try {
			const response = await ChatApi.getTimeline(selectedRoomId, undefined, 50);
			if (response.items.length > 0) {
				const messages = mapTimelineItemsToMessages(
					response.items,
					selectedRoomId,
					currentUserId
				);
				messages.forEach((message) => {
					newMessage(message);
				});
			}
			// Disable history loading if there are no more items
			if (!response.hasMore) {
				setHistoryLoadDisabled(selectedRoomId, true);
			}
		} catch (err) {
			console.error('[RoomView] Failed to load initial timeline:', err);
		}
	}, [selectedRoomId, currentUserId, newMessage, setHistoryLoadDisabled]);

	useEffect(() => {
		loadInitialTimeline();
	}, [loadInitialTimeline]);

	if (!roomType) {
		return (
			<Container mainAlignment="flex-start" orientation="horizontal">
				<ShimmeringConversationView />
				<ShimmeringInfoPanelView />
			</Container>
		);
	}
	return <Conversation roomId={selectedRoomId} />;
};

export default RoomView;
