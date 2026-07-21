/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { last } from 'lodash';

import { FasteningAction, MessageFastening } from '../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getEditAndDeleteFasteningSelector = (
	state: RootStore,
	roomId: string,
	stanzaId: string
): MessageFastening | undefined => {
	if (state.chatsRegistry[roomId]?.fastenings?.[stanzaId]) {
		const editAndDeleteFastenings = state.chatsRegistry[roomId]?.fastenings?.[stanzaId].filter(
			(fastening) =>
				fastening.action === FasteningAction.EDIT || fastening.action === FasteningAction.DELETE
		);
		return last(editAndDeleteFastenings);
	}
	return undefined;
};
