/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useMemo, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import CollapsedSidebarListItem from './CollapsedSidebarListItem';
import ConversationsFilter from './ConversationsFilter';
import ExpandedSidebarListItem from './ExpandedSidebarListItem';
import VirtualRoomsButton from './VirtualRoomTemporaryWidget/VirtualRoomsButton';
import { roomsListSecondaryBarLengthEqualityFn } from '../../../store/equalityFunctions/MessagesEqualityFunctions';
import { getRoomIdsOrderedLastMessage } from '../../../store/selectors/MessagesSelectors';
import { getCapability, getUserId } from '../../../store/selectors/SessionSelectors';
import { getUsersSelector } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { Member } from '../../../types/store/RoomTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
import DefaultUserSidebarView from '../../views/DefaultUserSidebarView';
import ShimmeringCollapsedListView from '../../views/shimmerViews/ShimmeringCollapsedListView';
import ShimmeringExpandedListView from '../../views/shimmerViews/ShimmeringExpandedListView';

type SecondaryBarSingleGroupsView = {
	expanded: boolean;
};

const CustomContainer = styled(Container)`
	cursor: default;
`;

const ConversationFilterContainer = styled(Container)`
	height: fit-content;
	position: sticky;
	top: 0;
	z-index: 1;
`;

const VirtualRoomContainer = styled(Container)`
	height: fit-content;
	position: sticky;
	bottom: 0;
	z-index: 3;
`;

const SecondaryBarSingleGroupsView: React.FC<SecondaryBarSingleGroupsView> = ({ expanded }) => {
	const [t] = useTranslation();
	const showConversationList = t('tooltip.showConversationList', 'Show conversations list');
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');

	const canVideoCall = useStore((store) => getCapability(store, CapabilityType.CAN_VIDEO_CALL));
	const sessionId: string | undefined = useStore(getUserId);
	const roomsIds = useStore<{ roomId: string; roomType: string; lastMessageTimestamp: number }[]>(
		getRoomIdsOrderedLastMessage,
		roomsListSecondaryBarLengthEqualityFn
	);
	const users = useStore(getUsersSelector);

	const [filteredConversationsIds, setFilteredConversationsIds] = useState<
		{ roomId: string; roomType: string; lastMessageTimestamp: number }[]
	>([]);
	const [filteredInput, setFilteredInput] = useState('');

	useEffect(() => {
		if (filteredInput === '') {
			setFilteredConversationsIds(roomsIds);
		} else {
			const filteredConversations: {
				roomId: string;
				roomType: string;
				lastMessageTimestamp: number;
			}[] = [];
			map(roomsIds, (room) => {
				if (room.roomType === 'group') {
					const roomName = useStore.getState().rooms[room.roomId].name;
					if (
						roomName &&
						roomName.toLocaleLowerCase().includes(filteredInput.toLocaleLowerCase())
					) {
						filteredConversations.push(room);
					}
				} else {
					const users: Member[] | undefined = useStore.getState().rooms[room.roomId].members;
					const userId = users
						? users[0].userId === sessionId
							? users[1].userId
							: users[0].userId
						: '';
					const userName = useStore.getState().users[userId].name;
					const userEmail = useStore.getState().users[userId].email
						? useStore.getState().users[userId].email.split('@')[0]
						: '';
					if (
						userName.toLocaleLowerCase().includes(filteredInput.toLocaleLowerCase()) ||
						userEmail.toLocaleLowerCase().includes(filteredInput.toLocaleLowerCase())
					) {
						filteredConversations.push(room);
					}
				}
			});
			setFilteredConversationsIds(filteredConversations);
		}
	}, [filteredInput, roomsIds, sessionId]);

	const ListItem = useMemo(
		() => (expanded ? ExpandedSidebarListItem : CollapsedSidebarListItem),
		[expanded]
	);

	const listOfRooms = useMemo(() => {
		const list = [];
		if (filteredConversationsIds.length !== 0) {
			map(filteredConversationsIds, (room) => {
				list.push(<ListItem roomId={room.roomId} key={`${room.roomId}_item`} />);
			});
		} else {
			list.push(
				<CustomContainer mainAlignment="flex-start" padding={{ top: '2rem' }} key="no_match_item">
					<Text color="gray1" size="small" weight="light">
						{noMatchLabel}
					</Text>
				</CustomContainer>
			);
		}
		return list;
	}, [filteredConversationsIds, noMatchLabel, ListItem]);

	const listView = useMemo(
		() =>
			size(users) !== 1 ? (
				roomsIds.length === 0 ? (
					expanded ? (
						<ShimmeringExpandedListView />
					) : (
						<ShimmeringCollapsedListView />
					)
				) : (
					<Container mainAlignment="flex-start">
						<ConversationFilterContainer>
							<ConversationsFilter
								expanded={expanded}
								setFilteredInput={setFilteredInput}
								key="conversations_filter_item"
							/>
						</ConversationFilterContainer>
						<Container mainAlignment="space-between">
							<Container height="fit" data-testid="conversations_list_filtered">
								{listOfRooms}
							</Container>
							{canVideoCall && (
								<VirtualRoomContainer>
									<VirtualRoomsButton expanded={expanded} />
								</VirtualRoomContainer>
							)}
						</Container>
					</Container>
				)
			) : (
				expanded && <DefaultUserSidebarView />
			),

		[canVideoCall, expanded, listOfRooms, roomsIds.length, users]
	);

	return expanded ? (
		<Container mainAlignment="flex-start">{listView}</Container>
	) : (
		<Container mainAlignment="flex-start" title={showConversationList}>
			{listView}
		</Container>
	);
};

export default SecondaryBarSingleGroupsView;
