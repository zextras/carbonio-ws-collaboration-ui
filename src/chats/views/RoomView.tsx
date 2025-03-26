/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';

import ShimmeringConversationView from './shimmerViews/ShimmeringConversationView';
import ShimmeringInfoPanelView from './shimmerViews/ShimmeringInfoPanelView';
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

	// Keep selectedRoom update
	useEffect(() => {
		setSelectedRoom(selectedRoomId);
	}, [selectedRoomId, setSelectedRoom]);

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
