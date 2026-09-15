/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { MessageType } from '../../types/store/ChatsRegistryTypes';
import type { TextMessage } from '../../types/store/ChatsRegistryTypes';

/**
 * Resolves the quoted message of a reply from the store, to hand it to the
 * SDK (which never reads the store). Same lookup the v1
 * `requestMessageSubjectOfReply` performed before hydrating `repliedMessage`;
 * with v2 ids `id === stanzaId`, so one match covers both v1 search keys.
 */
export function findRepliedMessage(roomId: string, replyToId?: string): TextMessage | undefined {
	if (!replyToId) {
		return undefined;
	}
	const messages = useStore.getState().chatsRegistry[roomId]?.messages ?? [];
	return messages.find(
		(message): message is TextMessage =>
			message.type === MessageType.TEXT_MSG && message.id === replyToId
	);
}
