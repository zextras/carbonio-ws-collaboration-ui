/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { roomsListSecondaryBarLengthEqualityFn } from '../../store/equalityFunctions/MessagesEqualityFunctions';
import { getRoomIdsOrderedLastMessage } from '../../store/selectors/MessagesSelectors';
import { getUsersSelector } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import DefaultUserSidebarView from '../../views/DefaultUserSidebarView';
import ShimmeringCollapsedListView from '../../views/shimmerViews/ShimmeringCollapsedListView';
import ShimmeringExpandedListView from '../../views/shimmerViews/ShimmeringExpandedListView';
import CollapsedSidebarListItem from './CollapsedSidebarListItem';
import ExpandedSidebarListItem from './ExpandedSidebarListItem';

type SecondaryBarSingleGroupsView = {
	expanded: boolean;
};

const SecondaryBarSingleGroupsView: React.FC<SecondaryBarSingleGroupsView> = ({ expanded }) => {
	const [t] = useTranslation();
	const showConversationList = t('tooltip.showConversationList', 'Show conversation list');

	const roomsIds = useStore<{ roomId: string; lastMessageTimestamp: number }[]>(
		getRoomIdsOrderedLastMessage,
		roomsListSecondaryBarLengthEqualityFn
	);
	const users = useStore(getUsersSelector);
	const ListItem = useMemo(
		() => (expanded ? ExpandedSidebarListItem : CollapsedSidebarListItem),
		[expanded]
	);

	const listOfRooms = useMemo(
		() => map(roomsIds, (room) => <ListItem roomId={room.roomId} />),
		[roomsIds, ListItem]
	);

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
		<Container mainAlignment="flex-start">{listView}</Container>
	) : (
		<Container mainAlignment="flex-start" title={showConversationList}>
			{listView}
		</Container>
	);
};

export default SecondaryBarSingleGroupsView;
