/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable react/jsx-no-useless-fragment */

import React, { Fragment, useMemo } from 'react';

import { Trans, useTranslation } from 'react-i18next';

import { getRoomNameSelector, getRoomTypeSelector } from '../store/selectors/RoomsSelectors';
import { getUserName } from '../store/selectors/UsersSelectors';
import useStore from '../store/Store';
import { ConfigurationMessage, OperationType } from '../types/store/MessageTypes';
import { RoomType } from '../types/store/RoomTypes';

export const useConfigurationMessageLabel = ({
	message
}: {
	message: ConfigurationMessage;
}): JSX.Element | string | undefined => {
	const [t] = useTranslation();

	const roomName = useStore((store) => getRoomNameSelector(store, message.roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, message.roomId));
	const actionMakerName = useStore((store) => getUserName(store, message.from));
	const displayedActionMaker = useMemo(
		() => (message.from === useStore.getState().session.id ? 'You' : actionMakerName),
		[actionMakerName, message.from]
	);
	const affiliatedName = useStore((store) => getUserName(store, message.value));

	switch (message.operation) {
		case OperationType.ROOM_NAME_CHANGED:
			return (
				<Trans
					i18nKey="configurationMessages.roomNameChanged"
					defaults='{{nameToDisplay}} changed the title of this Group in <i>"{{messageValue}}"</i>'
					values={{ name: displayedActionMaker, roomName: message.value }}
				/>
			);
		case OperationType.ROOM_DESCRIPTION_CHANGED:
			return message.value === '' ? (
				t(
					'configurationMessages.roomTopicRemoved',
					`${displayedActionMaker} removed ${roomName}'s topic`,
					{ name: displayedActionMaker, roomName }
				)
			) : (
				<Trans
					i18nKey={'configurationMessages.roomTopicChanged'}
					defaults='{{nameToDisplay}} changed the topic of {{roomName}} in <i>"{{messageValue}}"</i>'
					values={{ name: displayedActionMaker, roomName, topicName: message.value }}
				/>
			);
		case OperationType.ROOM_PICTURE_UPDATED:
			return t(
				'configurationMessages.roomPictureUpdated',
				`${displayedActionMaker} changed ${roomName}'s image`,
				{ name: displayedActionMaker, roomName }
			);
		case OperationType.ROOM_PICTURE_DELETED:
			return t(
				'configurationMessages.roomPictureDeleted',
				`${displayedActionMaker} restored the default ${roomName}'s image`,
				{ name: displayedActionMaker, roomName }
			);
		case OperationType.MEMBER_ADDED:
			if (roomType === RoomType.ONE_TO_ONE)
				return t('affiliationMessages.oneToOneCreated', 'New Chat created!');
			return t(
				'affiliationMessages.memberAdded',
				`${affiliatedName} has been added to ${roomName}`,
				{ userName: affiliatedName, roomName }
			);
		case OperationType.MEMBER_REMOVED:
			return t(
				'affiliationMessages.memberRemoved',
				`${affiliatedName} is no longer a member of the group`,
				{ userName: affiliatedName }
			);
		case OperationType.ROOM_CREATION:
			return t('affiliationMessages.groupCreated', `${roomName} created!`, {
				roomName
			});
		default: {
			console.warn('Configuration message to replace: ', message.operation);
			return undefined;
		}
	}
};

export const ConfigurationMessageLabel = ({
	message
}: {
	message: ConfigurationMessage;
}): JSX.Element => {
	const configurationMessageLabel = useConfigurationMessageLabel({ message });
	return <Fragment>{configurationMessageLabel}</Fragment>;
};
