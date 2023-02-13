/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
	getRoomMembers,
	getRoomNameSelector,
	getRoomTypeSelector
} from '../store/selectors/RoomsSelectors';
import { getUserName, getUsersSelector } from '../store/selectors/UsersSelectors';
import useStore from '../store/Store';
import { RoomType } from '../types/store/RoomTypes';

const ItalicText = styled(Text)`
	font-style: italic;
`;

export const useAffiliationMessage = (
	messageType: string,
	roomId: string,
	userId: string
): string | JSX.Element => {
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
		default:
			return '';
	}
};

export const useConfigurationMessage = (
	messageOperation: string,
	messageValue: string,
	messageFrom: string,
	roomId: string,
	sidebar?: boolean
): JSX.Element | string => {
	const [t] = useTranslation();

	const sessionId: string | undefined = useStore((store) => store.session.id);
	const roomName = useStore((store) => getRoomNameSelector(store, roomId));
	const actionName = useStore((store) => getUserName(store, messageFrom));

	const nameToDisplay = useMemo(
		() => (sessionId && messageFrom === sessionId ? 'You' : actionName),
		[actionName, messageFrom, sessionId]
	);

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
		default:
			return '';
	}
};
