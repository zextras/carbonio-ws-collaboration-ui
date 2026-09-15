/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { findRepliedMessage } from './findRepliedMessage';
import { getEditAndDeleteFasteningSelector } from '../../store/selectors/ChatsRegistrySelectors';
import useStore from '../../store/Store';
import { FasteningAction } from '../../types/store/ChatsRegistryTypes';
import type { TextMessage } from '../../types/store/ChatsRegistryTypes';

/**
 * Resolves the pinned message from the store WITH the latest live edit
 * applied. The banner renders its copy as-is — no render-time fastening
 * projection like the bubbles — and the v1 copy always landed already
 * merged (handleEditedPinnedMessage): without this merge, pinning a message
 * edited live would put the pre-edit text in the banner. Text-only merge,
 * like the v1 messagePinUpdated refresh; a DELETE fastening is left to the
 * live removal path (and to the backend's own unpin, plan §5.15).
 */
export function findPinnedMessageContent(
	roomId: string,
	messageId: string
): TextMessage | undefined {
	const message = findRepliedMessage(roomId, messageId);
	if (!message) {
		return undefined;
	}
	const fastening = getEditAndDeleteFasteningSelector(useStore.getState(), roomId, messageId);
	if (fastening?.action !== FasteningAction.EDIT) {
		return message;
	}
	return { ...message, text: fastening.value ?? '', edited: true };
}
