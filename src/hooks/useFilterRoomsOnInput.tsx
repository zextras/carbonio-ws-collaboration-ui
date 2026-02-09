/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo } from 'react';

import { isEqual } from 'lodash';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { FilteredConversation } from '../chats/components/secondaryBar/SecondaryBarView';
import { useOrderedRoomsInfoByLastMessage } from '../store/selectors/chatsRegistrySelectors/useOrderedRoomsInfoByLastMessage';
import { getUserId } from '../store/selectors/SessionSelectors';
import useStore from '../store/Store';
import { RoomType } from '../types/store/RoomTypes';
import UserDataRetriever from '../utils/UserDataRetriever';

export const useFilterRoomsOnInput = (filteredInput: string): FilteredConversation[] => {
	const sessionId = useStore(getUserId);
	const users = useStoreWithEqualityFn(
		useStore,
		(store) => {
			const result: Record<string, string> = {};
			Object.keys(store.users).forEach((userId) => {
				result[userId] = store.users[userId].name || store.users[userId].email;
			});
			return result;
		},
		isEqual
	);
	const roomsInfo = useOrderedRoomsInfoByLastMessage();

	const normalizedFilter = useMemo(() => filteredInput.toLowerCase().trim(), [filteredInput]);

	// Fetch user data for each member of the rooms to let user filters by group members
	useEffect(() => {
		if (normalizedFilter === '') return;
		const userIdsToFetch = new Set<string>();
		roomsInfo.forEach((room) => {
			room.members.forEach((member) => {
				userIdsToFetch.add(member.userId);
			});
		});
		userIdsToFetch.forEach((userId) => {
			UserDataRetriever.getDebouncedUser(userId);
		});
	}, [normalizedFilter, roomsInfo]);

	return useMemo(() => {
		if (normalizedFilter === '') return roomsInfo;

		const matchesUserFilter = (userId: string): boolean => {
			const user = users[userId];
			if (!user) return false;
			const name = user?.split('@')[0].toLowerCase() || '';
			return name.includes(normalizedFilter);
		};

		const filteredOneToOne: FilteredConversation[] = [];
		const filteredGroups: FilteredConversation[] = [];
		roomsInfo.forEach((room) => {
			// One-to-one rooms
			if (room.roomType !== RoomType.GROUP) {
				const otherUser = room.members.find((member) => member.userId !== sessionId);
				if (otherUser && matchesUserFilter(otherUser.userId)) {
					filteredOneToOne.push(room);
				}
				return;
			}
			// Group rooms - check name
			if (room.name.toLowerCase().includes(normalizedFilter)) {
				filteredGroups.push(room);
				return;
			}
			// Group rooms - check members
			const memberMatches = room.members.some((member) => matchesUserFilter(member.userId));
			if (memberMatches) {
				filteredGroups.push(room);
			}
		});
		return [...filteredOneToOne, ...filteredGroups];
	}, [normalizedFilter, roomsInfo, sessionId, users]);
};
