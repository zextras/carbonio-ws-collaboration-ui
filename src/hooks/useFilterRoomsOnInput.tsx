/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { map } from 'lodash';

import { FilteredConversation } from '../chats/components/secondaryBar/SecondaryBarSingleGroupsView';
import { getUserId } from '../store/selectors/SessionSelectors';
import useStore from '../store/Store';

export const useFilterRoomsOnInput = (
	roomsIds: FilteredConversation[]
): {
	setFilteredInput: Dispatch<SetStateAction<string>>;
	filteredConversationsIds: { roomId: string; roomType: string; lastMessageTimestamp: number }[];
} => {
	const sessionId = useStore(getUserId);

	const [filteredConversationsIds, setFilteredConversationsIds] = useState<
		{ roomId: string; roomType: string; lastMessageTimestamp: number }[]
	>([]);
	const [filteredInput, setFilteredInput] = useState('');

	useEffect(() => {
		if (filteredInput === '') {
			setFilteredConversationsIds(roomsIds);
		} else {
			const { users, rooms } = useStore.getState();
			const filteredGroups: FilteredConversation[] = [];
			const filteredOneToOne: FilteredConversation[] = [];
			map(roomsIds, (room) => {
				if (room.roomType === 'group') {
					const { name, members } = rooms[room.roomId];
					if (name?.toLocaleLowerCase().includes(filteredInput)) {
						filteredGroups.push(room);
					} else {
						members?.every((member) => {
							if (
								users[member.userId].name.toLocaleLowerCase().includes(filteredInput) ||
								users[member.userId].email.toLocaleLowerCase().includes(filteredInput)
							) {
								filteredGroups.push(room);
								return false;
							}
							return true;
						});
					}
				} else {
					const { members } = rooms[room.roomId];
					const userId = members
						? members[0].userId === sessionId
							? members[1].userId
							: members[0].userId
						: '';
					const userName = users[userId].name.toLocaleLowerCase();
					const userEmail = users[userId].email?.split('@')[0].toLocaleLowerCase();
					if (userName.includes(filteredInput) || userEmail.includes(filteredInput)) {
						filteredOneToOne.push(room);
					}
				}
			});
			setFilteredConversationsIds([...filteredOneToOne, ...filteredGroups]);
		}
	}, [filteredInput, roomsIds, sessionId]);

	return {
		filteredConversationsIds,
		setFilteredInput
	};
};
