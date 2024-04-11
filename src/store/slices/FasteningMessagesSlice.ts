/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { find, orderBy } from 'lodash';
import { StateCreator } from 'zustand';

import { MessageFastening } from '../../types/store/MessageTypes';
import { RootStore, FasteningMessagesSlice } from '../../types/store/StoreTypes';

export const useFasteningMessagesSlice: StateCreator<FasteningMessagesSlice> = (
	set: (...any: any) => void
) => ({
	fastenings: {},
	addFastening: (fastening: MessageFastening): void => {
		set(
			produce((draft: RootStore) => {
				// Create the fastenings object if it doesn't exist
				if (!draft.fastenings[fastening.roomId]) {
					draft.fastenings[fastening.roomId] = {};
				}
				if (!draft.fastenings[fastening.roomId][fastening.originalStanzaId]) {
					draft.fastenings[fastening.roomId][fastening.originalStanzaId] = [];
				}

				// Add fastening to the array only if it doesn't already exist
				if (
					!find(
						draft.fastenings[fastening.roomId][fastening.originalStanzaId],
						(f: MessageFastening) => f.id === fastening.id
					)
				) {
					draft.fastenings[fastening.roomId][fastening.originalStanzaId].push(fastening);
					draft.fastenings[fastening.roomId][fastening.originalStanzaId] = orderBy(
						draft.fastenings[fastening.roomId][fastening.originalStanzaId],
						['date']
					);
				}
			}),
			false,
			'FASTENINGS/ADD_FASTENING'
		);
	}
});
