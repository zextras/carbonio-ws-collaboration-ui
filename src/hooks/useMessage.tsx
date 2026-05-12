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
import { getMessagingBackend } from '../store/selectors/ConnectionSelector';
import useStore from '../store/Store';
import {
	FasteningAction,
	Message,
	MessageFastening,
	MessageType,
	TextMessage
} from '../types/store/ChatsRegistryTypes';

const useMessage = (roomId: string, messageId: string): Message | undefined => {
	const backend = useStore((store) => getMessagingBackend(store));
	const message = useStore<Message | undefined>((store) =>
		getMessageSelector(store, roomId, messageId)
	);

	const fastening = useStore<MessageFastening | undefined>((store) => {
		const stanzaId = message?.type === MessageType.TEXT_MSG ? message.stanzaId : '';
		return getEditAndDeleteFasteningSelector(store, roomId, stanzaId);
	});

	return useMemo((): Message | undefined => {
		if (message && fastening) {
			const fasteningProps = backend.applyFastening(
				fastening.action === FasteningAction.EDIT ? 'edit' : 'delete',
				fastening.value
			);
			if (fastening.action === FasteningAction.EDIT) {
				return {
					...message,
					...fasteningProps,
					text: fastening.value ?? '',
					editedStanzaId: fastening.stanzaId
				} as TextMessage;
			}
			if (fastening.action === FasteningAction.DELETE) {
				return {
					...message,
					...fasteningProps,
					text: '',
					attachment: undefined,
					replyTo: undefined
				} as TextMessage;
			}
		}
		return message;
	}, [backend, message, fastening]);
};

export default useMessage;
