/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable react/jsx-no-useless-fragment */

import React, { Fragment, useMemo } from 'react';

import { Trans, useTranslation } from 'react-i18next';

import { getRoomNameSelector, getRoomTypeSelector } from '../store/selectors/RoomsSelectors';
import { getUserId } from '../store/selectors/SessionSelectors';
import { getUserName } from '../store/selectors/UsersSelectors';
import useStore from '../store/Store';
import { ConfigurationMessage, OperationType } from '../types/store/MessageTypes';
import { RoomType } from '../types/store/RoomTypes';

export const useConfigurationMessageLabel = (
	message: ConfigurationMessage
): JSX.Element | string | undefined => {
	const [t] = useTranslation();
	const youLabel = t('status.you', 'You');

	const leggedUserId = useStore(getUserId);
	const roomName = useStore((store) => getRoomNameSelector(store, message.roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, message.roomId));
	const actionMakerUsername = useStore((store) => getUserName(store, message.from));
	const affiliatedUsername = useStore((store) => getUserName(store, message.value));

	const displayedActionMakerName = useMemo(
		() => (message.from === leggedUserId ? youLabel : actionMakerUsername),
		[actionMakerUsername, leggedUserId, message.from, youLabel]
	);

	const displayedAffiliatedName = useMemo(
		() => (message.value === leggedUserId ? youLabel : affiliatedUsername),
		[affiliatedUsername, leggedUserId, message.value, youLabel]
	);

	switch (message.operation) {
		case OperationType.ROOM_NAME_CHANGED:
			return (
				<Trans
					i18nKey="configurationMessages.roomNameChanged"
					defaults='{{name}} changed the title of this Group in <i>"{{roomName}}"</i>'
					values={{ name: displayedActionMakerName, roomName: message.value }}
				/>
			);
		case OperationType.ROOM_DESCRIPTION_CHANGED:
			return message.value === '' ? (
				t(
					'configurationMessages.roomTopicRemoved',
					`${displayedActionMakerName} removed ${roomName}'s topic.`,
					{ name: displayedActionMakerName, roomName }
				)
			) : (
				<Trans
					i18nKey={'configurationMessages.roomTopicChanged'}
					defaults='{{name}} changed the topic of {{roomName}} in <i>"{{topicName}}"</i>.'
					values={{ name: displayedActionMakerName, roomName, topicName: message.value }}
				/>
			);
		case OperationType.ROOM_PICTURE_UPDATED:
			return t(
				'configurationMessages.roomPictureUpdated',
				`${displayedActionMakerName} changed ${roomName}'s image.`,
				{ name: displayedActionMakerName, roomName }
			);
		case OperationType.ROOM_PICTURE_DELETED:
			return t(
				'configurationMessages.roomPictureDeleted',
				`${displayedActionMakerName} restored the default ${roomName}'s image.`,
				{ name: displayedActionMakerName, roomName }
			);
		case OperationType.MEMBER_ADDED:
			if (roomType === RoomType.ONE_TO_ONE)
				return t('affiliationMessages.oneToOneCreated', 'New Chat created!');
			return t(
				'affiliationMessages.memberAdded',
				`${displayedAffiliatedName} has been added to ${roomName}`,
				{ userName: displayedAffiliatedName, roomName }
			);
		case OperationType.MEMBER_REMOVED:
			return t(
				'affiliationMessages.memberRemoved',
				`${displayedAffiliatedName} is no longer a member of the group`,
				{ userName: displayedAffiliatedName }
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
	const configurationMessageLabel = useConfigurationMessageLabel(message);
	return <Fragment>{configurationMessageLabel}</Fragment>;
};
