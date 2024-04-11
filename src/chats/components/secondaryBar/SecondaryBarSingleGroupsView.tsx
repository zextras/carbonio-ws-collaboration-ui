/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import CollapsedSidebarListItem from './CollapsedSidebarListItem';
import ConversationsFilter from './ConversationsFilter';
import ExpandedSidebarListItem from './ExpandedSidebarListItem';
import VirtualRoomsButton from './VirtualRoomTemporaryWidget/VirtualRoomsButton';
import { useFilterRoomsOnInput } from '../../../hooks/useFilterRoomsOnInput';
import { getOneToOneAndGroupsInfoOrderedByLastMessage } from '../../../store/selectors/MessagesSelectors';
import { getCapability } from '../../../store/selectors/SessionSelectors';
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

export type FilteredConversation = {
	roomId: string;
	name: string;
	roomType: string;
	lastMessageTimestamp: number;
	members: Member[];
};

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomText = styled(Text)`
	text-align: center;
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
	const showConversationList = t('tooltip.showConversationList', 'Show chat list');
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');

	const canVideoCall = useStore((store) => getCapability(store, CapabilityType.CAN_VIDEO_CALL));
	const roomsIds = useStore<FilteredConversation[]>(getOneToOneAndGroupsInfoOrderedByLastMessage);
	const users = useStore(getUsersSelector);

	const [filteredInput, setFilteredInput] = useState('');

	const filteredConversationsIds = useFilterRoomsOnInput(filteredInput);

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
				<CustomContainer
					mainAlignment="flex-start"
					padding={{ vertical: '2rem', horizontal: '1rem' }}
					key="no_match_item"
				>
					<CustomText color="gray1" size="small" weight="light" overflow="break-word">
						{noMatchLabel}
					</CustomText>
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

		[canVideoCall, expanded, listOfRooms, roomsIds.length, setFilteredInput, users]
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
