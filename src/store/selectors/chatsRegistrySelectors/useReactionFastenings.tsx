/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter } from 'lodash';

import { FasteningAction, MessageFastening } from '../../../types/store/ChatsRegistryTypes';
import useStore from '../../Store';

export const useReactionFastenings = (roomId: string, stanzaId: string): MessageFastening[] => {
	const fastenings = useStore((store) => store.chatsRegistry[roomId]?.fastenings[stanzaId]);
	if (!fastenings) return [];

	const reactions = filter(
		fastenings,
		(fastening) => fastening.action === FasteningAction.REACTION
	);
	return reactions.reduce<MessageFastening[]>((acc, current) => {
		const index = acc.findIndex((r) => r.from === current.from);
		if (index === -1) {
			acc.push(current);
		} else if (acc[index].date < current.date) {
			acc[index] = current;
		}
		return acc;
	}, []);
};
