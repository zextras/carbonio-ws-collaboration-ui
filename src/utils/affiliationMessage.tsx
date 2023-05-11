/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'react-i18next';

import { RoomType } from '../types/store/RoomTypes';

export const affiliationMessage = (
	messageType: string,
	roomId: string,
	userId: string,
	actionMemberId: string | undefined,
	actionName: string,
	sessionId: string | undefined,
	roomType: string,
	roomName: string,
	affiliatedName: string,
	t: TFunction<'translation'>
): string => {
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
		`You started a Chat with ${affiliatedName}`,
		{
			userName: affiliatedName
		}
	);
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
		// when a user is added to a chat, used as a creation message in one-to-one
		case 'member': {
			if (roomType === RoomType.GROUP) {
				return memberAddedLabel;
			}
			return oneToOneCreatedLabel;
		}
		// when a user is removed from a chat
		case 'none': {
			return memberRemovedLabel;
		}
		// custom message for when a group is created
		case 'creation': {
			return groupCreatedLabel;
		}
		default: {
			console.warn('affiliation message to replace: ', messageType);
			return '';
		}
	}
};
