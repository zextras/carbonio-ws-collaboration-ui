/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { map, slice } from 'lodash';
import { useTranslation } from 'react-i18next';

import { getRoomTypeSelector } from '../store/selectors/RoomsSelectors';
import useStore from '../store/Store';
import { RoomType } from '../types/store/RoomTypes';
import UserDataRetriever from '../utils/UserDataRetriever';

export const useIsWritingLabel = (
	roomId: string,
	isInsideSidebar?: boolean
): string | undefined => {
	const { t } = useTranslation();
	const isTypingLabel = t('status.isTyping', 'is typing...');
	const areTypingLabel = t('status.areTyping', 'are typing...');

	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const isWritingList = useStore((state) => state.activeConversations[roomId]?.isWritingList);
	const writingListNames = useMemo(() => {
		const roomIsWritingList: string[] = [];
		const store = useStore.getState();
		if (isWritingList) {
			roomIsWritingList.push(
				...map(isWritingList, (userId) => {
					UserDataRetriever.getAsyncUsername(userId);
					return store.users[userId]?.name || store.users[userId]?.email || '';
				})
			);
			return roomIsWritingList;
		}
		return [];
	}, [isWritingList]);

	if (writingListNames === undefined || writingListNames?.length === 0) return undefined;
	if (writingListNames?.length === 1) {
		if (roomType !== RoomType.ONE_TO_ONE) {
			return isInsideSidebar
				? `${writingListNames[0].split(/(\s+)/)[0]} ${isTypingLabel}`
				: `${writingListNames.toString()} ${isTypingLabel}`;
		}
		return isInsideSidebar
			? `${writingListNames[0].split(/(\s+)/)[0]} ${isTypingLabel}`
			: isTypingLabel;
	}
	const usersWritingListNames: string[] = [];
	map(writingListNames, (user) => {
		usersWritingListNames.push(user.split(/(\s+)/)[0]);
	});
	if (!isInsideSidebar) {
		const someWritingUsers = slice(usersWritingListNames, 0, 3);
		if (writingListNames.length <= 3) {
			return `${someWritingUsers.join(', ')} ${areTypingLabel}`;
		}
		return t(
			'status.nameAndNumberOfPeopleAreTyping',
			`${someWritingUsers[0]} and ${someWritingUsers.length} others are typing...`,
			{
				userName: someWritingUsers[0],
				numberOfUsers: someWritingUsers.length
			}
		);
	}
	return t(
		'status.numberOfPeopleAreTyping',
		`${usersWritingListNames.length} people are typing...`,
		{
			numberOfUsers: usersWritingListNames.length
		}
	);
};
