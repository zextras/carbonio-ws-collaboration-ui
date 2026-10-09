/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { MessageType } from '../../types/store/ChatsRegistryTypes';
import type { TextMessage } from '../../types/store/ChatsRegistryTypes';

/**
 * Resolves the room's sidebar last message when it is the target of an
 * EDIT/DELETE fastening, to hand it to the SDK (which never reads the store).
 * Same match the v1 fastening handler performed inline before rebuilding the
 * sidebar entry; resolved at event time so the merge never regresses the
 * sidebar onto a message that stopped being the last one.
 */
export function findFastenedLastMessage(
	roomId: string,
	messageId: string
): TextMessage | undefined {
	const lastMessage = useStore.getState().chatsRegistry[roomId]?.lastMessage;
	return lastMessage?.type === MessageType.TEXT_MSG && lastMessage.stanzaId === messageId
		? lastMessage
		: undefined;
}
