/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import { RootStore, TemporaryMessagesReferencesSlice } from '../../types/store/StoreTypes';
import { TemporaryReferenceMessage } from '../../types/store/TemporaryMessagesReferencesTypes';

export const useTemporaryConversationsMessagesReferencesSlice = (
	set: (...any: any) => void
): TemporaryMessagesReferencesSlice => ({
	temporaryRoomsMessagesReferences: {},
	addDeletedMessageRef: (roomId: string, messageDeleted: TemporaryReferenceMessage): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.temporaryRoomsMessagesReferences[messageDeleted.roomId]) {
					draft.temporaryRoomsMessagesReferences[messageDeleted.roomId] = [];
				}
				draft.temporaryRoomsMessagesReferences[messageDeleted.roomId].push(messageDeleted);
			}),
			false,
			'TEMP_CONV_MESS_REFS/ADD_DELETED_MESSAGE_REF'
		);
	},
	removeDeletedMessageRef: () => null
});
