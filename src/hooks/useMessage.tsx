/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import {
	getEditAndDeleteFasteningSelector,
	getMessageSelector
} from '../store/selectors/ChatsRegistrySelectors';
import { getIsMongooseIM } from '../store/selectors/ConnectionSelector';
import useStore from '../store/Store';
import {
	FasteningAction,
	Message,
	MessageFastening,
	MessageType,
	TextMessage
} from '../types/store/ChatsRegistryTypes';

const useMessage = (roomId: string, messageId: string): Message | undefined => {
	const isMongooseIM = useStore((store) => getIsMongooseIM(store));
	const message = useStore<Message | undefined>((store) =>
		getMessageSelector(store, roomId, messageId)
	);

	const fastening = useStore<MessageFastening | undefined>((store) => {
		const stanzaId = message?.type === MessageType.TEXT_MSG ? message.stanzaId : '';
		return getEditAndDeleteFasteningSelector(store, roomId, stanzaId);
	});

	return useMemo((): Message | undefined => {
		if (message) {
			if (fastening) {
				if (isMongooseIM) {
					// XMPP: fastenings carry the delta; apply as deprecated boolean flags
					switch (fastening.action) {
						case FasteningAction.EDIT: {
							return {
								...message,
								edited: true,
								text: fastening.value ?? '',
								editedStanzaId: fastening.stanzaId
							} as TextMessage;
						}
						case FasteningAction.DELETE: {
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
				} else {
					// REST+WS: use structured editedInfo/deletedInfo objects
					switch (fastening.action) {
						case FasteningAction.EDIT: {
							return {
								...message,
								editedInfo: { editedAt: new Date().toISOString() },
								text: fastening.value ?? ''
							} as TextMessage;
						}
						case FasteningAction.DELETE: {
							return {
								...message,
								deletedInfo: { deletedBy: '', deletedAt: new Date().toISOString() },
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
			}
			return message;
		}
		return undefined;
	}, [isMongooseIM, message, fastening]);
};

export default useMessage;
