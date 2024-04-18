/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import CollapsedSidebarListItem from './CollapsedSidebarListItem';
import ExpandedSidebarListItem from './ExpandedSidebarListItem';
import { useFilterRoomsOnInput } from '../../../../hooks/useFilterRoomsOnInput';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomText = styled(Text)`
	text-align: center;
`;

type FilteredConversationListProps = {
	input: string;
	expanded: boolean;
};

const FilteredConversationList: React.FC<FilteredConversationListProps> = ({ input, expanded }) => {
	const [t] = useTranslation();
	// TODO update translation default value
	const noMatchLabel = t(
		'participantsList.noMatch',
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
				padding={{ vertical: '2rem', horizontal: '1rem' }}
				key="no_match_item"
			>
				<CustomText
					color="gray1"
					size="small"
					weight="light"
					overflow={expanded ? 'break-word' : 'ellipsis'}
				>
					{noMatchLabel}
				</CustomText>
			</CustomContainer>
		);
	}, [filteredConversationsIds, expanded, noMatchLabel, ListItem]);

	return (
		<Container height="fit" data-testid="conversations_list_filtered">
			{listOfRooms}
		</Container>
	);
};

export default FilteredConversationList;
