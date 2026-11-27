/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import SearchResultMessage from './SearchResultMessage';
import { chatClient } from '../../../network/chatClient/ChatClient';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { screen, setup } from '../../../tests/test-utils';
import { scrollToMessage } from '../../../utils/__mocks__/scrollUtils';

vi.mock('../../../utils/scrollUtils');

const RESULT_ID = 'far-result';
const room = createMockRoom({ id: 'room-result' });
const result = createMockTextMessage({
	id: RESULT_ID,
	stanzaId: RESULT_ID,
	roomId: room.id,
	text: 'needle',
	date: 1700000000000
});

beforeEach(() => {
	useStore.getState().addRooms([room]);
});

describe('SearchResultMessage jump', () => {
	test('asks to bring a result that is not in store into view, with its date, then scrolls to it', async () => {
		const jump = vi.spyOn(chatClient, 'requestMessageResultHistoryToId').mockResolvedValue();
		const { user } = setup(<SearchResultMessage message={result} searchText="zzz" />);

		await user.click(screen.getByText('needle'));

		expect(jump).toHaveBeenCalledExactlyOnceWith(room.id, RESULT_ID, 1700000000000);
		await vi.waitFor(() => expect(scrollToMessage).toHaveBeenCalledWith(RESULT_ID));
		expect(useStore.getState().activeConversations[room.id]?.selectedSearchResult).toBe(RESULT_ID);
	});

	test('only scrolls to a result that is already in store', async () => {
		const jump = vi.spyOn(chatClient, 'requestMessageResultHistoryToId').mockResolvedValue();
		useStore.getState().updateHistory(room.id, [result]);
		const { user } = setup(<SearchResultMessage message={result} searchText="zzz" />);

		await user.click(screen.getByText('needle'));

		expect(jump).not.toHaveBeenCalled();
		expect(scrollToMessage).toHaveBeenCalledWith(RESULT_ID);
	});

	test('on 2.0.0 jumps again to a selected result that has left the window', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const jump = vi.spyOn(chatClient, 'requestMessageResultHistoryToId').mockResolvedValue();
		useStore.getState().setSelectedSearchResult(room.id, RESULT_ID);
		const { user } = setup(<SearchResultMessage message={result} searchText="zzz" />);

		await user.click(screen.getByText('needle'));

		expect(jump).toHaveBeenCalledTimes(1);
	});
});
