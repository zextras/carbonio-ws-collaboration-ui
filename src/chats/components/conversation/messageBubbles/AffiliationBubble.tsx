/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CustomMessage } from './MessageFactory';
import { roomMembersLengthFn } from '../../../../store/equalityFunctions/RoomsEqualityFunctions';
import { usersNameEmailEqualityFn } from '../../../../store/equalityFunctions/UsersEqualityFunctions';
import {
	getRoomMembers,
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import { getUserName, getUsersSelector } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { AffiliationMessage } from '../../../../types/store/MessageTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { affiliationMessage } from '../../../../utils/affiliationMessage';

type AffiliationMsgProps = {
	message: AffiliationMessage;
	refEl: React.RefObject<HTMLElement>;
};

const AffiliationBubble: FC<AffiliationMsgProps> = ({ message, refEl }) => {
	const [t] = useTranslation();

	const users = useStore(getUsersSelector, usersNameEmailEqualityFn);
	const roomType = useStore((store) => getRoomTypeSelector(store, message.roomId));
	const roomName = useStore((store) => getRoomNameSelector(store, message.roomId));
	const sessionId: string | undefined = useStore((store) => store.session.id);
	const roomMembers = useStore(
		(store) => getRoomMembers(store, message.roomId),
		roomMembersLengthFn
	);
	const affiliatedName = useStore((store) => getUserName(store, message.userId));

	// id of the users who acts, in this case the one who creates the one-to-one conversation
	const actionMemberId = useMemo(() => {
		if (roomType === RoomType.ONE_TO_ONE) {
			return find(roomMembers, (member) => member.userId !== message.userId)?.userId;
		}
		return '';
	}, [roomMembers, roomType, message.userId]);

	const actionName = useMemo(() => {
		if (actionMemberId !== undefined) {
			return users[actionMemberId]?.name || users[actionMemberId]?.email || actionMemberId;
		}
		return '';
	}, [actionMemberId, users]);

	const affiliationLabel = affiliationMessage(
		message.as,
		message.roomId,
		message.userId,
		actionMemberId,
		actionName,
		sessionId,
		roomType,
		roomName,
		affiliatedName || '',
		t
	);

	return (
		<CustomMessage
			id={`message-${message.id}`}
			ref={refEl}
			mainAlignment={'flex-start'}
			crossAlignment={'flex-start'}
			borderColor="gray3"
			key={message.id}
			serviceMessage
			data-testid={`affiliation_msg-${message.id}`}
		>
			<Text color={'gray1'}>{affiliationLabel}</Text>
		</CustomMessage>
	);
};

export default AffiliationBubble;
