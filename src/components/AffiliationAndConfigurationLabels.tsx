/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React from 'react';
import { TFunction } from 'react-i18next';
import styled from 'styled-components';

import { RoomType } from '../types/store/RoomTypes';
import { UsersMap } from '../types/store/UserTypes';

const ItalicText = styled(Text)`
	font-style: italic;
`;

export const affiliationMessage = (
	messageType: string,
	roomType: string,
	t: TFunction<'translation'>,
	affiliatedName: string,
	roomName: string,
	users: UsersMap,
	actionMemberId: string | undefined,
	sessionId: string | undefined
): string | JSX.Element => {
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

	// eslint-disable-next-line default-case
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
	}
	return '';
};

export const configurationMessage = (
	messageOperation: string,
	messageValue: string,
	t: TFunction<'translation'>,
	nameToDisplay: string | false | null,
	roomName: string,
	sidebar?: boolean
): JSX.Element | string => {
	const roomNameChangedLabel = t(
		'configurationMessages.roomNameChanged',
		`${nameToDisplay} changed the title of this Group in `,
		{ name: nameToDisplay }
	);

	const roomDescriptionChangedLabel = t(
		'configurationMessages.roomTopicChanged',
		`${nameToDisplay} changed the topic of ${roomName} in `,
		{ name: nameToDisplay, roomName }
	);

	const pictureUpdatedLabel = t(
		'configurationMessages.roomPictureUpdated',
		`${nameToDisplay} changed ${roomName}'s image`,
		{ name: nameToDisplay, roomName }
	);

	const pictureDeletedLabel = t(
		'configurationMessages.roomPictureDeleted',
		`${nameToDisplay} restored the default ${roomName}'s image`,
		{ name: nameToDisplay, roomName }
	);

	// eslint-disable-next-line default-case
	switch (messageOperation) {
		case 'roomNameChanged': {
			return !sidebar ? (
				<>
					{roomNameChangedLabel}
					<ItalicText overflow="break-word" size={'medium'} color={'gray1'}>
						&quot;{messageValue}&quot;
					</ItalicText>
				</>
			) : (
				`${roomNameChangedLabel} "${messageValue}"`
			);
		}
		case 'roomDescriptionChanged': {
			return !sidebar ? (
				<>
					{roomDescriptionChangedLabel}
					<ItalicText overflow="break-word" size={'medium'} color={'gray1'}>
						&quot;{messageValue}&quot;
					</ItalicText>
				</>
			) : (
				`${roomDescriptionChangedLabel} "${messageValue}"`
			);
		}
		case 'roomPictureUpdated': {
			return pictureUpdatedLabel;
		}
		case 'roomPictureDeleted': {
			return pictureDeletedLabel;
		}
	}
	return '';
};
