/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { last } from 'lodash';

import { MessageFastening } from '../../types/store/MessageTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getFasteningSelector = (
	state: RootStore,
	roomId: string,
	stanzaId: string
): MessageFastening | undefined => {
	if (state.fastenings?.[roomId]?.[stanzaId]) {
		return last(state.fastenings[roomId][stanzaId]);
	}
	return undefined;
};
