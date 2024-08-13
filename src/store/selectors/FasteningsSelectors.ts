/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, includes, last, reduce } from 'lodash';

import { MessageFastening } from '../../types/store/MessageTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getEditAndDeleteFasteningSelector = (
	state: RootStore,
	roomId: string,
	stanzaId: string
): MessageFastening | undefined => {
	if (state.fastenings?.[roomId]?.[stanzaId]) {
		const editAndDeleteFastenings = state.fastenings[roomId][stanzaId].filter(
			(fastening) => fastening.action === 'edit' || fastening.action === 'delete'
		);
		return last(editAndDeleteFastenings);
	}
	return undefined;
};

export const getReactionFastenings = (
	state: RootStore,
	roomId: string,
	stanzaId: string
): MessageFastening[] => {
	const fastenings = state.fastenings?.[roomId]?.[stanzaId];
	if (fastenings) {
		const reactions = filter(fastenings, (fastening) => fastening.action === 'reaction');
		const latestReactions = reduce(
			reactions,
			(acc: { [from: string]: number }, fastening: MessageFastening, index: number) => {
				if (!acc[fastening.from] || reactions[acc[fastening.from]].date < fastening.date) {
					acc[fastening.from] = index;
				}
				return acc;
			},
			{}
		);
		return filter(reactions, (_, index) => includes(Object.values(latestReactions), index));
	}
	return [];
};

export const getMyLastReaction = (
	state: RootStore,
	roomId: string,
	stanzaId: string
): string | undefined => {
	const fastenings = state.fastenings?.[roomId]?.[stanzaId];
	if (fastenings) {
		const myReactions = filter(
			fastenings,
			(fastening) => fastening.action === 'reaction' && fastening.from === state.session?.id
		);
		return last(myReactions)?.value;
	}
	return undefined;
};
