/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { findLast } from 'lodash';

import useStore from '../../store/Store';
import { FasteningAction, MessageType } from '../../types/store/ChatsRegistryTypes';
import type { TextMessage } from '../../types/store/ChatsRegistryTypes';
import { parseIsoMicros } from '../../utils/isoMicros';

/**
 * Resolves the room's sidebar last message when it is the target of an
 * EDIT/DELETE fastening, to hand it to the SDK (which never reads the store).
 * Same match the v1 fastening handler performed inline before rebuilding the
 * sidebar entry; resolved at event time so the merge never regresses the
 * sidebar onto a message that stopped being the last one. With `editedAt` the
 * event is an edit: it is not resolved when the message was deleted (a delete
 * is terminal) or when a newer edit is already applied (the fastenings are
 * kept sorted by date; an equal date is the same write, applied idempotently).
 */
export function findFastenedLastMessage(
	roomId: string,
	messageId: string,
	editedAt?: string
): TextMessage | undefined {
	const { chatsRegistry } = useStore.getState();
	const lastMessage = chatsRegistry[roomId]?.lastMessage;
	if (lastMessage?.type !== MessageType.TEXT_MSG || lastMessage.stanzaId !== messageId) {
		return undefined;
	}
	if (editedAt !== undefined) {
		const fastenings = chatsRegistry[roomId]?.fastenings?.[messageId] ?? [];
		if (fastenings.some((fastening) => fastening.action === FasteningAction.DELETE)) {
			return undefined;
		}
		const latestEdit = findLast(
			fastenings,
			(fastening) => fastening.action === FasteningAction.EDIT
		);
		if (latestEdit && latestEdit.date > parseIsoMicros(editedAt)) {
			return undefined;
		}
	}
	return lastMessage;
}
