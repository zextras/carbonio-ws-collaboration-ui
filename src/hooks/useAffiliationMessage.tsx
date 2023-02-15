/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	getRoomMembers,
	getRoomNameSelector,
	getRoomTypeSelector
} from '../store/selectors/RoomsSelectors';
import { getUserName, getUsersSelector } from '../store/selectors/UsersSelectors';
import useStore from '../store/Store';
import { RoomType } from '../types/store/RoomTypes';

export const useAffiliationMessage = (
	messageType: string,
	roomId: string,
	userId: string
): string => {
	const [t] = useTranslation();

	const users = useStore(getUsersSelector);
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const roomName = useStore((store) => getRoomNameSelector(store, roomId));
	const sessionId: string | undefined = useStore((store) => store.session.id);
	const roomMembers = useStore((store) => getRoomMembers(store, roomId));
	const affiliatedName = useStore((store) => getUserName(store, userId));

	// id of the users who acts, in this case the one who creates the one-to-one conversation
	const actionMemberId = useMemo(() => {
		if (roomType === RoomType.ONE_TO_ONE) {
			return find(roomMembers, (member) => member.userId !== userId)?.userId;
		}
		return '';
	}, [roomMembers, roomType, userId]);

	const memberAddedLabel = t(
		'affiliationMessages.memberAdded',
		`${affiliatedName} has been added to ${roomName}`,
		{ userName: affiliatedName, roomName }
	);
	const memberRemovedLabel = t(
		'affiliationMessages.memberRemoved',
		`${affiliatedName} has been removed from ${roomName}`,
		{ userName: affiliatedName, roomName }
	);
	const groupCreatedLabel = t('affiliationMessages.groupCreated', `${roomName} created!`, {
		roomName
	});
	const oneToOneCreated = t('affiliationMessages.oneToOneCreated', 'New Chat created!');
	const youCreatedOneToOne = t(
		'affiliationMessages.youCreatedOneToOne',
		`You started a chat with ${affiliatedName}`,
		{
			userName: affiliatedName
		}
	);

	const actionName =
		actionMemberId !== undefined
			? users[actionMemberId]?.name || users[actionMemberId]?.email || actionMemberId
			: '';
	const someoneCreatedOneToOne = t(
		'affiliationMessages.SomeoneElseCreatedOneToOne',
		`${actionName} started a chat with you`,
		{ userName: actionName }
	);

	const oneToOneCreatedLabel =
		actionMemberId === '' || actionMemberId === undefined
			? oneToOneCreated
			: actionMemberId === sessionId
			? youCreatedOneToOne
			: someoneCreatedOneToOne;

	switch (messageType) {
		case 'member': {
			if (roomType === RoomType.GROUP) {
				return memberAddedLabel;
			}
			return oneToOneCreatedLabel;
		}
		case 'none': {
			return memberRemovedLabel;
		}
		case 'creation': {
			return groupCreatedLabel;
		}
		default: {
			return 'affiliation message to replace';
		}
	}
};
