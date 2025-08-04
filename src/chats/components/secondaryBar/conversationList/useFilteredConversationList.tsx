/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Container, List } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

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

	const filtering = useMemo(() => input !== '', [input]);

	const ListItem = useMemo(
		() => (expanded ? ExpandedSidebarListItem : CollapsedSidebarListItem),
		[expanded]
	);

	const [itemsDisplayedNumber, setItemsDisplayedNumber] = useState<number>(10);

	const loadItems = useCallback(() => {
		if (size(filteredConversationsIds) > itemsDisplayedNumber && !filtering) {
			setItemsDisplayedNumber((prevState) => prevState + 3);
		}
	}, [filteredConversationsIds, filtering, itemsDisplayedNumber]);

	const listOfRooms = useMemo(() => {
		const items = filtering
			? filteredConversationsIds
			: filteredConversationsIds.slice(0, itemsDisplayedNumber);
		return map(items, (room) => <ListItem roomId={room.roomId} key={`${room.roomId}_item`} />);
	}, [ListItem, filteredConversationsIds, filtering, itemsDisplayedNumber]);

	const FilteredConversationList = useMemo(
		() => (
			<Container
				data-testid="conversations_list_filtered"
				height={!filtering ? '100%' : 'fit'}
				maxHeight={!filtering ? 'fit' : 'auto'}
				padding={{ vertical: 'small' }}
			>
				{size(filteredConversationsIds) > 0 ? (
					<List onListBottom={loadItems}>{listOfRooms}</List>
				) : (
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
				)}
			</Container>
		),
		[expanded, filteredConversationsIds, filtering, listOfRooms, loadItems, noMatchLabel]
	);

	return {
		conversationResultSize: size(filteredConversationsIds),
		FilteredConversationList
	};
};
export default useFilteredConversationList;
