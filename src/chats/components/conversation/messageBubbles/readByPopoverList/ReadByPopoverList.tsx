/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useMemo } from 'react';

import { find, forEach } from 'lodash';
import { useTranslation } from 'react-i18next';

import {
	getMessagesSelector,
	getMarkers
} from '../../../../../store/selectors/ChatsRegistrySelectors';
import { getUserId } from '../../../../../store/selectors/SessionSelectors';
import useStore from '../../../../../store/Store';
import { MessageType } from '../../../../../types/store/ChatsRegistryTypes';
import { isBefore } from '../../../../../utils/dateUtils';
import UserPopoverList from '../../../userPopoverList/UserPopoverList';

type ReadByProps = {
	roomId: string;
	stanzaId: string;
	anchorRef: React.RefObject<HTMLElement>;
};
const ReadByPopoverList = ({ roomId, stanzaId, anchorRef }: ReadByProps): ReactElement => {
	const [t] = useTranslation();
	const seenByLabel = t('readBy.title', 'Seen by:');

	const sessionId: string | undefined = useStore((store) => getUserId(store));
	const messages = useStore((store) => getMessagesSelector(store, roomId));
	const markers = useStore((store) => getMarkers(store, roomId));

	const readingUsers = useMemo(() => {
		const messageDate = find(
			messages,
			(message) => message.type === MessageType.TEXT_MSG && message.stanzaId === stanzaId
		)?.date;

		if (!messageDate) return [];
		const readBy: string[] = [];
		forEach(markers, (marker, userId: string) => {
			const markedMessage = find(messages, (message) => message.id === marker.messageId);
			const dateToCompare = markedMessage?.date ?? marker.markerDate;
			if (marker.from !== sessionId && isBefore(messageDate, dateToCompare)) {
				readBy.push(userId);
			}
		});
		return readBy;
	}, [markers, messages, sessionId, stanzaId]);

	return (
		<UserPopoverList
			anchorEl={anchorRef}
			userList={readingUsers}
			title={seenByLabel}
			icon="DoneAll"
			iconColor="primary"
			displayPresence
		/>
	);
};

export default ReadByPopoverList;
