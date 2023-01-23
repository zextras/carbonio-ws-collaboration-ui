/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { roomsListSecondaryBarLengthEqualityFn } from '../../store/equalityFunctions/MessagesEqualityFunctions';
import { getRoomIdsOrderedLastMessage } from '../../store/selectors/MessagesSelectors';
import { getUsersSelector } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { Member } from '../../types/store/RoomTypes';
import DefaultUserSidebarView from '../../views/DefaultUserSidebarView';
import ShimmeringCollapsedListView from '../../views/shimmerViews/ShimmeringCollapsedListView';
import ShimmeringExpandedListView from '../../views/shimmerViews/ShimmeringExpandedListView';
import CollapsedSidebarListItem from './CollapsedSidebarListItem';
import ConversationsFilter from './ConversationsFilter';
import ExpandedSidebarListItem from './ExpandedSidebarListItem';

type SecondaryBarSingleGroupsView = {
	expanded: boolean;
};

const CustomContainer = styled(Container)`
	cursor: default;
`;

const SecondaryBarSingleGroupsView: React.FC<SecondaryBarSingleGroupsView> = ({ expanded }) => {
	const [t] = useTranslation();
	const showConversationList = t('tooltip.showConversationList', 'Show conversation list');
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');

	const sessionId: string | undefined = useStore((store) => store.session.id);
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
					if (roomName.toLocaleLowerCase().includes(filteredInput.toLocaleLowerCase())) {
						filteredConversations.push(room);
					}
				} else {
					const users: Member[] | undefined = useStore.getState().rooms[room.roomId].members;
					const userId = users?.[0].userId === sessionId ? users![1]?.userId : users![0].userId;
					const userName = useStore.getState().users[userId].name;
					if (userName.toLocaleLowerCase().includes(filteredInput.toLocaleLowerCase())) {
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
		list.push(
			<ConversationsFilter
				expanded={expanded}
				setFilteredInput={setFilteredInput}
				key="conversations_filter_item"
			/>
		);
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
	}, [expanded, filteredConversationsIds, noMatchLabel, ListItem]);

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
					listOfRooms
				)
			) : (
				expanded && <DefaultUserSidebarView />
			),

		[expanded, listOfRooms, roomsIds.length, users]
	);

	return expanded ? (
		<Container mainAlignment="flex-start" data-testid="conversations_list_modal">
			{listView}
		</Container>
	) : (
		<Container mainAlignment="flex-start" title={showConversationList}>
			{listView}
		</Container>
	);
};

export default SecondaryBarSingleGroupsView;
