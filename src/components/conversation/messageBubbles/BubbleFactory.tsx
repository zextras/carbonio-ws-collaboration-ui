/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import moment from 'moment-timezone';
import React, { ReactElement, useMemo } from 'react';

import { getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import { getPrefTimezoneSelector } from '../../../store/selectors/SessionSelectors';
import { getUserSelector } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { parseUrlOnMessage } from '../../../utils/parseUrlOnMessage';
import { calculateAvatarColor } from '../../../utils/styleUtils';
import Bubble from './Bubble';

type BubbleFactoryProps = {
	message: TextMessage;
	prevMessageIsFromSameSender: boolean;
	nextMessageIsFromSameSender: boolean;
	messageRef: React.RefObject<HTMLElement>;
};

const BubbleFactory = ({
	message,
	prevMessageIsFromSameSender,
	nextMessageIsFromSameSender,
	messageRef
}: BubbleFactoryProps): ReactElement => {
	const mySessionId = useStore((store) => store.session.id);
	const senderInfo = useStore((store) => getUserSelector(store, message?.from));
	const timezone = useStore(getPrefTimezoneSelector);
	const roomType = useStore<RoomType>((store) => getRoomTypeSelector(store, message.roomId));

	const senderIdentifier = useMemo(
		() =>
			senderInfo
				? senderInfo.name
					? senderInfo.name
					: senderInfo.email
					? senderInfo.email
					: senderInfo.id
				: null,
		[senderInfo]
	);

	const messageTime = moment.tz(message.date, timezone).format('HH:mm');
	const isMyMessage = mySessionId === message.from;
	const messageFormatted = useMemo(() => parseUrlOnMessage(message.text), [message.text]);
	const userColor = useMemo(() => calculateAvatarColor(senderIdentifier || ''), [senderIdentifier]);

	return (
		<Bubble
			key={`message${message.id}`}
			refEl={messageRef}
			isMyMessage={isMyMessage}
			senderInfo={senderIdentifier}
			message={message}
			messageTime={messageTime}
			messageFormatted={messageFormatted}
			prevMessageIsFromSameSender={prevMessageIsFromSameSender}
			nextMessageIsFromSameSender={nextMessageIsFromSameSender}
			userColor={userColor}
			roomType={roomType}
		/>
	);
};

export default BubbleFactory;
