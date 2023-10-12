/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { getFasteningSelector } from '../store/selectors/FasteningsSelectors';
import { getMessageSelector } from '../store/selectors/MessagesSelectors';
import useStore from '../store/Store';
import { Message, MessageFastening, MessageType, TextMessage } from '../types/store/MessageTypes';

const useMessage = (roomId: string, messageId: string): Message | undefined => {
	const message = useStore<Message | undefined>((store) =>
		getMessageSelector(store, roomId, messageId)
	);

	const fastening = useStore<MessageFastening | undefined>((store) => {
		const stanzaId = message?.type === MessageType.TEXT_MSG ? message.stanzaId : '';
		return getFasteningSelector(store, roomId, stanzaId);
	});

	return useMemo((): Message | undefined => {
		if (message) {
			if (fastening) {
				switch (fastening.action) {
					case 'edit': {
						return {
							...message,
							edited: true,
							text: fastening.value || ''
						} as TextMessage;
					}
					case 'delete': {
						return {
							...message,
							deleted: true,
							text: '',
							attachment: undefined,
							replyTo: undefined
						} as TextMessage;
					}
					default: {
						return message;
					}
				}
			}
			return message;
		}
		return undefined;
	}, [message, fastening]);
};

export default useMessage;
