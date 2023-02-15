/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getRoomNameSelector } from '../store/selectors/RoomsSelectors';
import { getUserName } from '../store/selectors/UsersSelectors';
import useStore from '../store/Store';

const ItalicText = styled(Text)`
	font-style: italic;
`;

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
						{`"${messageValue}"`}
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
						{`"${messageValue}"`}
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
		default: {
			return 'configuration message to replace';
		}
	}
};
