/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { find, map } from 'lodash';

import { FilteredConversation } from '../chats/components/secondaryBar/SecondaryBarView';
import { getOneToOneAndGroupsInfoOrderedByLastMessage } from '../store/selectors/MessagesSelectors';
import { getUserId } from '../store/selectors/SessionSelectors';
import { getUsersSelector } from '../store/selectors/UsersSelectors';
import useStore from '../store/Store';

export const useFilterRoomsOnInput = (filteredInput: string): FilteredConversation[] => {
	const roomsInfo = useStore<FilteredConversation[]>(getOneToOneAndGroupsInfoOrderedByLastMessage);
	const sessionId = useStore(getUserId);
	const users = useStore(getUsersSelector);

	return useMemo(() => {
		if (filteredInput === '') return roomsInfo;
		const nameIncludedInFilter = (userId: string, filter: string): boolean =>
			users[userId]?.name?.toLocaleLowerCase().includes(filter);

		const emailIncludedInFilter = (userId: string, filter: string): boolean =>
			users[userId]?.email?.split('@')[0].toLocaleLowerCase().includes(filter);

		const filter = filteredInput.toLocaleLowerCase();
		const filteredGroups: FilteredConversation[] = [];
		const filteredOneToOne: FilteredConversation[] = [];
		map(roomsInfo, (room) => {
			const userId = find(room.members, (member) => member.userId !== sessionId)?.userId;

			if (
				room.roomType !== 'group' &&
				userId &&
				(nameIncludedInFilter(userId, filter) || emailIncludedInFilter(userId, filter))
			) {
				filteredOneToOne.push(room);
			} else if (room.roomType === 'group' && room.name.toLocaleLowerCase().includes(filter)) {
				filteredGroups.push(room);
			} else {
				room.members.every((member) => {
					if (
						room.roomType === 'group' &&
						(nameIncludedInFilter(member.userId, filter) ||
							emailIncludedInFilter(member.userId, filter))
					) {
						filteredGroups.push(room);
						return false;
					}
					return true;
				});
			}
		});
		return [...filteredOneToOne, ...filteredGroups];
	}, [filteredInput, roomsInfo, sessionId, users]);
};
