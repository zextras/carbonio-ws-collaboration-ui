/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import CollapsedSidebarListItem from './CollapsedSidebarListItem';
import ExpandedSidebarListItem from './ExpandedSidebarListItem';
import { useFilterRoomsOnInput } from '../../../../hooks/useFilterRoomsOnInput';
import { SecondaryBarInfoText } from '../SecondaryBarView';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const useFilteredConversationList = (
	input: string,
	expanded: boolean
): {
	conversationResultSize: number;
	FilteredConversationList: JSX.Element;
} => {
	const [t] = useTranslation();
	const noMatchLabel = t(
		'participantsList.noMatch.chatList',
		'There are no users matching this search in your existing chats.'
	);

	const filteredConversationsIds = useFilterRoomsOnInput(input);

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
				padding={{ top: '2rem', bottom: '1.5rem', horizontal: '1rem' }}
				key="no_match_item"
			>
				<SecondaryBarInfoText
					color="gray1"
					size="small"
					weight="light"
					overflow={expanded ? 'break-word' : 'ellipsis'}
				>
					{noMatchLabel}
				</SecondaryBarInfoText>
			</CustomContainer>
		);
	}, [filteredConversationsIds, expanded, noMatchLabel, ListItem]);

	const FilteredConversationList = useMemo(
		() => (
			<Container
				height="fit"
				data-testid="conversations_list_filtered"
				padding={{ vertical: 'small' }}
			>
				{listOfRooms}
			</Container>
		),
		[listOfRooms]
	);

	return {
		conversationResultSize: size(filteredConversationsIds),
		FilteredConversationList
	};
};
export default useFilteredConversationList;
