/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { filter } from 'lodash';

import { FasteningAction, MessageFastening } from '../../../types/store/ChatsRegistryTypes';
import useStore from '../../Store';

const EMPTY_ARRAY: MessageFastening[] = [];

export const useReactionFastenings = (roomId: string, stanzaId: string): MessageFastening[] => {
	// Select raw fastenings array from store (reference stable when unchanged)
	const fastenings = useStore(
		(store) => store.chatsRegistry[roomId]?.fastenings?.[stanzaId] ?? EMPTY_ARRAY
	);

	// Memoize the computation based on the fastenings array reference
	return useMemo(() => {
		if (fastenings.length === 0) return EMPTY_ARRAY;

		const reactions = filter(
			fastenings,
			(fastening) => fastening.action === FasteningAction.REACTION
		);

		// Keep only the latest reaction per user (by date)
		return reactions.reduce<MessageFastening[]>((acc, current) => {
			const index = acc.findIndex((r) => r.from === current.from);
			if (index === -1) {
				acc.push(current);
			} else if (acc[index].date < current.date) {
				acc[index] = current;
			}
			return acc;
		}, []);
	}, [fastenings]);
};
