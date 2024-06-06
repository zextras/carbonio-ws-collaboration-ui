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

	const loggedUserId = useStore(getUserId);
	const roomName = useStore((store) => getRoomNameSelector(store, message.roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, message.roomId));
	const actionMakerUsername = useStore((store) => getUserName(store, message.from));
	const affiliatedUsername = useStore((store) => getUserName(store, message.value));

	const roomNameChangedLabel = useMemo(() => {
		if (loggedUserId === message.from) {
			return (
				<Trans
					i18nKey="configurationMessages.user.roomNameChanged"
					defaults='You changed the title of this Group in <i>"{{roomName}}"</i>.'
					values={{ roomName: message.value }}
				/>
			);
		}
		return (
			<Trans
				i18nKey="configurationMessages.member.roomNameChanged"
				defaults='{{name}} changed the title of this Group in <i>"{{roomName}}"</i>.'
				values={{ name: actionMakerUsername, roomName: message.value }}
			/>
		);
	}, [loggedUserId, message, actionMakerUsername]);

	const roomDescriptionChangedLabel = useMemo(() => {
		if (message.value === '') {
			if (loggedUserId === message.from) {
				return t(
					'configurationMessages.user.roomTopicRemoved',
					"You removed {{roomName}}'s topic.",
					{ roomName }
				);
			}
			return t(
				'configurationMessages.member.roomTopicRemoved',
				`{{name}} removed {{roomName}}'s topic.`,
				{
					name: actionMakerUsername,
					roomName
				}
			);
		}
		if (loggedUserId === message.from) {
			return (
				<Trans
					i18nKey="configurationMessages.user.roomTopicChanged"
					defaults='You changed the topic of {{roomName}} in "<i>{{topicName}}</i>".'
					values={{ roomName, topicName: message.value }}
				/>
			);
		}
		return (
			<Trans
				i18nKey="configurationMessages.member.roomTopicChanged"
				defaults='{{name}} changed the topic of {{roomName}} in "<i>{{topicName}}</i>".'
				values={{ name: actionMakerUsername, roomName, topicName: message.value }}
			/>
		);
	}, [message, loggedUserId, actionMakerUsername, roomName, t]);

	const roomPictureUpdatedLabel = useMemo(() => {
		if (loggedUserId === message.from) {
			return t(
				'configurationMessages.user.roomPictureUpdated',
				"You changed {{roomName}}'s image.",
				{ roomName }
			);
		}
		return t(
			'configurationMessages.member.roomPictureUpdated',
			`{{name}} changed {{roomName}}'s image.`,
			{ name: actionMakerUsername, roomName }
		);
	}, [actionMakerUsername, loggedUserId, message.from, roomName, t]);

	const roomPictureDeletedLabel = useMemo(() => {
		if (loggedUserId === message.from) {
			return t(
				'configurationMessages.user.roomPictureDeleted',
				"You have restored the default {{roomName}}'s image.",
				{ roomName }
			);
		}
		return t(
			'configurationMessages.member.roomPictureDeleted',
			`{{name}} restored the default {{roomName}}'s image.`,
			{ name: actionMakerUsername, roomName }
		);
	}, [actionMakerUsername, loggedUserId, message.from, roomName, t]);

	const memberAddedLabel = useMemo(() => {
		if (roomType === RoomType.ONE_TO_ONE)
			return t('affiliationMessages.oneToOneCreated', 'New Chat created!');
		if (loggedUserId === message.value) {
			return t('affiliationMessages.user.Added', 'You have been added to {{roomName}}.', {
				roomName
			});
		}
		return t('affiliationMessages.member.Added', `{{userName}} has been added to {{roomName}}.`, {
			userName: affiliatedUsername,
			roomName
		});
	}, [affiliatedUsername, loggedUserId, message.value, roomName, roomType, t]);

	const memberRemovedLabel = useMemo(() => {
		if (loggedUserId === message.value) {
			return t('affiliationMessages.user.Removed', 'You are no longer a member of {{roomName}}.', {
				roomName
			});
		}
		return t(
			'affiliationMessages.member.Removed',
			`{{userName}} is no longer a member of {{roomName}}.`,
			{ userName: affiliatedUsername, roomName }
		);
	}, [affiliatedUsername, loggedUserId, message.value, roomName, t]);

	switch (message.operation) {
		case OperationType.ROOM_NAME_CHANGED:
			return roomNameChangedLabel;
		case OperationType.ROOM_DESCRIPTION_CHANGED:
			return roomDescriptionChangedLabel;
		case OperationType.ROOM_PICTURE_UPDATED:
			return roomPictureUpdatedLabel;
		case OperationType.ROOM_PICTURE_DELETED:
			return roomPictureDeletedLabel;
		case OperationType.MEMBER_ADDED:
			return memberAddedLabel;
		case OperationType.MEMBER_REMOVED:
			return memberRemovedLabel;
		case OperationType.ROOM_CREATION:
			return t('affiliationMessages.groupCreated', `${roomName} created!`, { roomName });
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
