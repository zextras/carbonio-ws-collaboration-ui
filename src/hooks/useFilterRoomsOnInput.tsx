/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { find, map } from 'lodash';

import { FilteredConversation } from '../chats/components/secondaryBar/SecondaryBarSingleGroupsView';
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

		const filteredGroups: FilteredConversation[] = [];
		const filteredOneToOne: FilteredConversation[] = [];
		map(roomsInfo, (room) => {
			if (room.roomType === 'group') {
				if (room.name.toLocaleLowerCase().includes(filteredInput)) {
					filteredGroups.push(room);
				} else {
					room.members.every((member) => {
						if (
							users[member.userId]?.name?.toLocaleLowerCase().includes(filteredInput) ||
							users[member.userId]?.email?.split('@')[0].toLocaleLowerCase().includes(filteredInput)
						) {
							filteredGroups.push(room);
							return false;
						}
						return true;
					});
				}
			} else {
				const userId = find(room.members, (member) => member.userId !== sessionId)?.userId;
				if (userId) {
					const userName = users[userId]?.name?.toLocaleLowerCase();
					const userEmail = users[userId]?.email?.split('@')[0].toLocaleLowerCase();
					if (userName?.includes(filteredInput) || userEmail?.includes(filteredInput)) {
						filteredOneToOne.push(room);
					}
				}
			}
		});
		return [...filteredOneToOne, ...filteredGroups];
	}, [filteredInput, roomsInfo, sessionId, users]);
};
