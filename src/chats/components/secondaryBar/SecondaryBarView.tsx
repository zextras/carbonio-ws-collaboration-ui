/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Tooltip, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useFilteredConversationList from './conversationList/useFilteredConversationList';
import ConversationsFilter from './ConversationsFilter';
import useFilteredGal from './galSeachList/useFilteredGal';
import VirtualRoomsButton from './virtualRoomWidget/VirtualRoomsButton';
import { getAreConversationsToShowSelector } from '../../../store/selectors/RoomsSelectors';
import { getAttribute } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { Member } from '../../../types/store/RoomTypes';
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
	members: Member[];
};

export const SecondaryBarInfoText = styled(Text)`
	text-align: center;
`;

type SecondaryBarSingleGroupsViewProps = {
	expanded: boolean;
};

const SecondaryBarView: React.FC<SecondaryBarSingleGroupsViewProps> = ({ expanded }) => {
	const [t] = useTranslation();
	const noResultsLabel = t(
		'participantsList.noMatch.all',
		'There are no users matching this search in your existing chats or in your company.'
	);

	const videoCallEnabled = useStore((store) => getAttribute(store, 'videoCallEnabled'));
	const areConversationsToShow = useStore(getAreConversationsToShowSelector);
	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const privateChatCreation = useStore((store) => getAttribute(store, 'privateChatCreation'));

	const [filteredInput, setFilteredInput] = useState('');

	const { conversationResultSize, FilteredConversationList } = useFilteredConversationList(
		filteredInput,
		expanded
	);
	const { galResultSize, FilteredGal } = useFilteredGal(
		privateChatCreation ? filteredInput : '',
		expanded
	);

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
			areConversationsToShow ? (
				<Container>
					<ConversationsFilter
						expanded={expanded}
						setFilteredInput={setFilteredInput}
						key="conversations_filter_item"
					/>
					<ScrollContainer mainAlignment="flex-start">
						{noResults ? (
							<Container padding={{ vertical: '2rem', horizontal: '1rem' }} height="fit">
								<Tooltip label={noResultsLabel} overflowTooltip>
									<SecondaryBarInfoText
										color="gray1"
										size="small"
										weight="light"
										overflow={expanded ? 'break-word' : 'ellipsis'}
									>
										{noResultsLabel}
									</SecondaryBarInfoText>
								</Tooltip>
							</Container>
						) : (
							<>
								{FilteredConversationList}
								{filteredInput !== '' && !!privateChatCreation && FilteredGal}
							</>
						)}
					</ScrollContainer>
					{videoCallEnabled && filteredInput === '' && <VirtualRoomsButton expanded={expanded} />}
				</Container>
			) : (
				<DefaultUserSidebarView expanded={expanded} />
			),
		[
			areConversationsToShow,
			expanded,
			noResults,
			noResultsLabel,
			FilteredConversationList,
			filteredInput,
			privateChatCreation,
			FilteredGal,
			videoCallEnabled
		]
	);

	return (
		<Container mainAlignment="flex-start">
			{chatsBeNetworkStatus ? ListView : <ShimmeringListView />}
		</Container>
	);
};

export default SecondaryBarView;
