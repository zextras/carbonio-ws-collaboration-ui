/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';
import { TFunction, Trans } from 'react-i18next';

export const configurationMessage = (
	messageOperation: string,
	messageValue: string,
	messageFrom: string,
	roomId: string,
	roomName: string,
	nameToDisplay: string,
	t: TFunction<'translation'>
): JSX.Element | string => {
	const roomNameChangedLabel = (
		<Trans
			i18nKey="configurationMessages.roomNameChanged"
			defaults='{{nameToDisplay}} changed the title of this Group in "<i>{{messageValue}}</i>"'
			values={{ name: nameToDisplay, roomName: messageValue }}
		/>
	);

	const roomDescriptionChangedLabel = (
		<Trans
			i18nKey={'configurationMessages.roomTopicChanged'}
			defaults='{{nameToDisplay}} changed the topic of {{roomName}} in "<i>{{messageValue}}"</i>'
			values={{ name: nameToDisplay, roomName, topicName: messageValue }}
		/>
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
			return roomNameChangedLabel;
		}
		case 'roomDescriptionChanged': {
			return roomDescriptionChangedLabel;
		}
		case 'roomPictureUpdated': {
			return pictureUpdatedLabel;
		}
		case 'roomPictureDeleted': {
			return pictureDeletedLabel;
		}
		default: {
			console.warn('configuration message to replace: ', messageOperation);
			return '';
		}
	}
};
