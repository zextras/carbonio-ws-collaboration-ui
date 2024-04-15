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
import FilteredGal from './FilteredGal';
import VirtualRoomsButton from './VirtualRoomTemporaryWidget/VirtualRoomsButton';
import { useFilterRoomsOnInput } from '../../../hooks/useFilterRoomsOnInput';
import { getOneToOneAndGroupsInfoOrderedByLastMessage } from '../../../store/selectors/MessagesSelectors';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { Member } from '../../../types/store/RoomTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
import DefaultUserSidebarView from '../../views/DefaultUserSidebarView';
import ShimmeringCollapsedListView from '../../views/shimmerViews/ShimmeringCollapsedListView';
import ShimmeringExpandedListView from '../../views/shimmerViews/ShimmeringExpandedListView';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomText = styled(Text)`
	text-align: center;
`;

const VirtualRoomContainer = styled(Container)`
	height: fit-content;
	position: sticky;
	bottom: 0;
	z-index: 3;
`;

export type FilteredConversation = {
	roomId: string;
	name: string;
	roomType: string;
	lastMessageTimestamp: number;
	members: Member[];
};

type SecondaryBarSingleGroupsViewProps = {
	expanded: boolean;
};

const SecondaryBarSingleGroupsView: React.FC<SecondaryBarSingleGroupsViewProps> = ({
	expanded
}) => {
	const [t] = useTranslation();
	const showConversationList = t('tooltip.showConversationList', 'Show chat list');
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');

	const canVideoCall = useStore((store) => getCapability(store, CapabilityType.CAN_VIDEO_CALL));
	const roomsIds = useStore<FilteredConversation[]>(getOneToOneAndGroupsInfoOrderedByLastMessage);
	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);

	const [filteredInput, setFilteredInput] = useState('');

	const filteredConversationsIds = useFilterRoomsOnInput(filteredInput);

	const ListItem = useMemo(
		() => (expanded ? ExpandedSidebarListItem : CollapsedSidebarListItem),
		[expanded]
	);

	const listOfRooms = useMemo(() => {
		if (size(filteredConversationsIds) > 0) {
			return map(filteredConversationsIds, (room) => (
				<ListItem roomId={room.roomId} key={`${room.roomId}_item`} />
			));
		}
		return (
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
	}, [filteredConversationsIds, noMatchLabel, ListItem]);

	const ShimmeringListView = useMemo(
		() => (expanded ? ShimmeringExpandedListView : ShimmeringCollapsedListView),
		[expanded]
	);

	const ListView = useMemo(
		() =>
			size(roomsIds) > 0 ? (
				<Container mainAlignment="flex-start">
					<ConversationsFilter
						expanded={expanded}
						setFilteredInput={setFilteredInput}
						key="conversations_filter_item"
					/>
					<Container mainAlignment="space-between">
						<Container height="fit" data-testid="conversations_list_filtered">
							{listOfRooms}
						</Container>
						{filteredInput !== '' && <FilteredGal expanded={expanded} input={filteredInput} />}
						{canVideoCall && (
							<VirtualRoomContainer>
								<VirtualRoomsButton expanded={expanded} />
							</VirtualRoomContainer>
						)}
					</Container>
				</Container>
			) : (
				<DefaultUserSidebarView />
			),
		[canVideoCall, expanded, filteredInput, listOfRooms, roomsIds]
	);

	const titleLabel = useMemo(
		() => (expanded ? showConversationList : undefined),
		[expanded, showConversationList]
	);

	return (
		<Container mainAlignment="flex-start" title={titleLabel}>
			{chatsBeNetworkStatus ? ListView : <ShimmeringListView />}
		</Container>
	);
};

export default SecondaryBarSingleGroupsView;
