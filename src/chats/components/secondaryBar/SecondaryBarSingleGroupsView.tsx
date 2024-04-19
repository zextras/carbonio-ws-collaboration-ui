/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo, useState } from 'react';

import { Container, TextWithTooltip } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useFilteredConversationList from './conversationList/useFilteredConversationList';
import ConversationsFilter from './ConversationsFilter';
import useFilteredGal from './galSeachList/useFilteredGal';
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
	overflow-y: auto;
`;

export type FilteredConversation = {
	roomId: string;
	name: string;
	roomType: string;
	lastMessageTimestamp: number;
	members: Member[];
};

export const SecondaryBarInfoText = styled(TextWithTooltip)`
	text-align: center;
`;

type SecondaryBarSingleGroupsViewProps = {
	expanded: boolean;
};

const SecondaryBarSingleGroupsView: React.FC<SecondaryBarSingleGroupsViewProps> = ({
	expanded
}) => {
	const [t] = useTranslation();
	const showConversationList = t('tooltip.showConversationList', 'Show chat list');
	const noResultsLabel = t(
		'',
		'There are no users matching this search in your existing chats or in your company.'
	);

	const canVideoCall = useStore((store) => getCapability(store, CapabilityType.CAN_VIDEO_CALL));
	const roomsIds = useStore<FilteredConversation[]>(getOneToOneAndGroupsInfoOrderedByLastMessage);
	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);

	const [filteredInput, setFilteredInput] = useState('');

	const { conversationResultSize, FilteredConversationList } = useFilteredConversationList(
		filteredInput,
		expanded
	);
	const { galResultSize, FilteredGal } = useFilteredGal(filteredInput, expanded);

	const ShimmeringListView = useMemo(
		() => (expanded ? ShimmeringExpandedListView : ShimmeringCollapsedListView),
		[expanded]
	);

	const noResults = useMemo(
		() => conversationResultSize + galResultSize === 0,
		[conversationResultSize, galResultSize]
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
						{noResults ? (
							<Container padding={{ vertical: '2rem', horizontal: '1rem' }} height="fit">
								<SecondaryBarInfoText
									color="gray1"
									size="small"
									weight="light"
									overflow={expanded ? 'break-word' : 'ellipsis'}
								>
									{noResultsLabel}
								</SecondaryBarInfoText>
							</Container>
						) : (
							<>
								{FilteredConversationList}
								{filteredInput !== '' && FilteredGal}
							</>
						)}
					</ScrollContainer>
					{canVideoCall && <VirtualRoomsButton expanded={expanded} />}
				</Container>
			) : (
				<DefaultUserSidebarView />
			),
		[
			FilteredConversationList,
			FilteredGal,
			canVideoCall,
			expanded,
			filteredInput,
			noResults,
			noResultsLabel,
			roomsIds
		]
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
