/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getMyLastReaction } from './ChatsRegistrySelectors';
import { createMockMessageFastening } from '../../tests/createMock';
import { FasteningAction, MessageFastening } from '../../types/store/ChatsRegistryTypes';
import useStore from '../Store';

describe('getMyLastReaction', () => {
	const roomId = 'room-reaction';
	const stanzaId = 'msg-reaction';

	const reaction = (id: string, date: number, value: string, from = 'me'): MessageFastening =>
		createMockMessageFastening({
			id,
			roomId,
			originalStanzaId: stanzaId,
			action: FasteningAction.REACTION,
			from,
			date,
			value
		});

	const seed = (...fastenings: MessageFastening[]): void => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.setState((state) => ({
			chatsRegistry: {
				...state.chatsRegistry,
				[roomId]: {
					...state.chatsRegistry[roomId],
					messages: [],
					fastenings: { [stanzaId]: fastenings }
				}
			}
		}));
	};

	beforeEach(() => {
		useStore.getState().setApiVersion('2.0.0');
	});
	afterEach(() => {
		useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
	});

	test('picks the latest reaction by date, not by array position', () => {
		seed(reaction('r2', 2000, '❤️'), reaction('r1', 1000, '👍'));
		expect(getMyLastReaction(useStore.getState(), roomId, stanzaId)).toBe('❤️');
	});

	test('a later removal (empty value) is the latest state', () => {
		seed(reaction('r1', 1000, '👍'), reaction('r2', 2000, ''));
		expect(getMyLastReaction(useStore.getState(), roomId, stanzaId)).toBe('');
	});

	test('ignores the reactions of other users', () => {
		seed(reaction('r1', 1000, '👍'), reaction('r2', 2000, '😂', 'other'));
		expect(getMyLastReaction(useStore.getState(), roomId, stanzaId)).toBe('👍');
	});

	test('on equal dates the later fastening wins', () => {
		seed(reaction('r1', 1000, '👍'), reaction('r2', 1000, '❤️'));
		expect(getMyLastReaction(useStore.getState(), roomId, stanzaId)).toBe('❤️');
	});

	test('on 1.6.x the last fastening of the array wins, as before', () => {
		useStore.getState().setApiVersion('1.6.14');
		seed(reaction('r2', 2000, '❤️'), reaction('r1', 1000, '👍'));
		expect(getMyLastReaction(useStore.getState(), roomId, stanzaId)).toBe('👍');
	});
});
