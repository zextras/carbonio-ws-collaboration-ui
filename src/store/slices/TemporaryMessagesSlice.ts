/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import { RootStore, TemporaryMessagesSlice } from '../../types/store/StoreTypes';
import { TemporaryMessage } from '../../types/store/TemporaryMessagesReferencesTypes';

export const useTemporaryMessagesSlice = (set: (...any: any) => void): TemporaryMessagesSlice => ({
	temporaryMessages: {},
	addDeletedMessageRef: (roomId: string, messageDeleted: TemporaryMessage): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.temporaryMessages[messageDeleted.roomId]) {
					draft.temporaryMessages[messageDeleted.roomId] = {
						[`deleted_${messageDeleted.id}`]: messageDeleted
					};
				} else if (
					!draft.temporaryMessages[messageDeleted.roomId][`deleted_${messageDeleted.id}`]
				) {
					draft.temporaryMessages[messageDeleted.roomId][`deleted_${messageDeleted.id}`] =
						messageDeleted;
				}
			}),
			false,
			'TEMP_CONV_MESS_REFS/ADD_DELETED_MESSAGE_REF'
		);
	}
});
