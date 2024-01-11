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

// Render TestRoom ONLY when we are sure room is present in the store
const RoomView = (): ReactElement => {
	// Retrieve room id from url
	const params: { roomId?: string } = useParams();
	const selectedRoomId: string = useMemo(
		() => (params && params.roomId ? decodeURIComponent(params.roomId) : ''),
		[params]
	);

	const setSelectedRoomOneToOneGroup = useStore((state) => state.setSelectedRoomOneToOneGroup);
	const roomType = useStore((store) => getRoomTypeSelector(store, selectedRoomId));

	// Keep selectedRoomOneToOneGroup update
	useEffect(() => {
		setSelectedRoomOneToOneGroup(selectedRoomId);
	}, [selectedRoomId, setSelectedRoomOneToOneGroup]);

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
