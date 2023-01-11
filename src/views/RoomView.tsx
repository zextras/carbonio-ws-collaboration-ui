/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import Conversation from '../components/conversation/Conversation';
import { roomMainInfoEqualityFn } from '../store/equalityFunctions/RoomsEqualityFunctions';
import { getRoomSelector } from '../store/selectors/RoomsSelectors';
import useStore from '../store/Store';
import ShimmeringConversationView from './shimmerViews/ShimmeringConversationView';
import ShimmeringInfoPanelView from './shimmerViews/ShimmeringInfoPanelView';

// Render TestRoom ONLY when we are sure room is present in the store
const RoomView = (): ReactElement => {
	// Retrieve room id from url
	const params: { roomId?: string } = useParams();
	const setSelectedRoomOneToOneGroup = useStore((state) => state.setSelectedRoomOneToOneGroup);

	const selectedRoomId: string = useMemo(
		() => (params && params.roomId ? decodeURIComponent(params.roomId) : ''),
		[params]
	);

	// Keep selectedRoomOneToOneGroup updates
	useEffect(() => {
		setSelectedRoomOneToOneGroup(selectedRoomId);
	}, [selectedRoomId, setSelectedRoomOneToOneGroup]);

	const room = useStore((store) => getRoomSelector(store, selectedRoomId), roomMainInfoEqualityFn);

	if (!room) {
		return (
			<Container mainAlignment="flex-start" orientation="horizontal">
				<ShimmeringConversationView />
				<ShimmeringInfoPanelView />
			</Container>
		);
	}
	return <Conversation room={room} />;
};

export default RoomView;
