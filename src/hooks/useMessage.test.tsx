/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';

import useMessage from './useMessage';
import useStore from '../store/Store';
import {
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage
} from '../tests/createMock';
import { TextMessage } from '../types/store/MessageTypes';

describe('Test useMessage custom hook', () => {
	test('Message without modification', () => {
		const room = createMockRoom();
		const message = createMockTextMessage();
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);

		const { result } = renderHook(() => useMessage(message.roomId, message.id));

		expect(result.current).toEqual(message);
	});

	test('Deletion of a message ', () => {
		const room = createMockRoom();
		const message = createMockTextMessage();
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);

		const { result } = renderHook(() => useMessage(message.roomId, message.id));
		expect(result.current).toEqual(message);

		const fastening = createMockMessageFastening({
			roomId: message.roomId,
			originalStanzaId: message.stanzaId,
			action: 'delete'
		});
		act(() => store.addFastening(fastening));
		const messageResult = result.current as TextMessage;
		expect(messageResult.deleted).toBeTruthy();
		expect(messageResult.text).toBe('');
	});

	test('Edit of a message ', () => {
		const room = createMockRoom();
		const message = createMockTextMessage();
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);

		const { result } = renderHook(() => useMessage(message.roomId, message.id));
		expect(result.current).toEqual(message);

		const fastening = createMockMessageFastening({
			roomId: message.roomId,
			originalStanzaId: message.stanzaId,
			action: 'edit',
			value: 'Edited message'
		});
		act(() => store.addFastening(fastening));
		const messageResult = result.current as TextMessage;
		expect(messageResult.edited).toBeTruthy();
		expect(messageResult.text).toBe('Edited message');
	});
});
