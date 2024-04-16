/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ConversationsFilter from './ConversationsFilter';
import FilteredConversationList from './FilteredConversationList';
import FilteredGal from './FilteredGal';
import VirtualRoomsButton from './VirtualRoomTemporaryWidget/VirtualRoomsButton';
import { getOneToOneAndGroupsInfoOrderedByLastMessage } from '../../../store/selectors/MessagesSelectors';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { Member } from '../../../types/store/RoomTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
import DefaultUserSidebarView from '../../views/DefaultUserSidebarView';
import ShimmeringCollapsedListView from '../../views/shimmerViews/ShimmeringCollapsedListView';
import ShimmeringExpandedListView from '../../views/shimmerViews/ShimmeringExpandedListView';

const ScrollContainer = styled(Container)`
	overflow-y: scroll;
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

	const canVideoCall = useStore((store) => getCapability(store, CapabilityType.CAN_VIDEO_CALL));
	const roomsIds = useStore<FilteredConversation[]>(getOneToOneAndGroupsInfoOrderedByLastMessage);
	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);

	const [filteredInput, setFilteredInput] = useState('');

	const ShimmeringListView = useMemo(
		() => (expanded ? ShimmeringExpandedListView : ShimmeringCollapsedListView),
		[expanded]
	);

	const ListView = useMemo(
		() =>
			size(roomsIds) > 0 ? (
				<Container>
					<ConversationsFilter
						expanded={expanded}
						setFilteredInput={setFilteredInput}
						key="conversations_filter_item"
					/>
					<ScrollContainer mainAlignment="flex-start">
						<FilteredConversationList input={filteredInput} expanded={expanded} />
						{filteredInput !== '' && <FilteredGal input={filteredInput} expanded={expanded} />}
					</ScrollContainer>
					{canVideoCall && <VirtualRoomsButton expanded={expanded} />}
				</Container>
			) : (
				<DefaultUserSidebarView />
			),
		[canVideoCall, expanded, filteredInput, roomsIds]
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
