/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import type { Mock } from 'vitest';

import MessageForwardLoader from './MessageForwardLoader';
import { chatClient } from '../../../network/chatClient/ChatClient';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { mockIntersectionObserverDisconnect } from '../../../tests/setupTests';
import { screen, setup, triggerObserver } from '../../../tests/test-utils';

const room = createMockRoom({ id: 'room-forward' });

const renderLoader = (): ReturnType<typeof setup> => {
	const ref = React.createRef<HTMLDivElement>();
	return setup(
		<>
			<div ref={ref} />
			<MessageForwardLoader roomId={room.id} messageListRef={ref} />
		</>
	);
};

const addRow = (id: string): void =>
	useStore.getState().updateHistory(room.id, [createMockTextMessage({ id, roomId: room.id })]);

beforeEach(() => {
	useStore.getState().addRooms([room]);
	addRow('first');
});

describe('MessageForwardLoader', () => {
	test('asks the next page when it comes into view', async () => {
		const next = vi.spyOn(chatClient, 'requestMessagesAfter').mockImplementation(() => {
			addRow('second');
			return Promise.resolve();
		});
		renderLoader();

		await triggerObserver(screen.getByTestId('messageForwardLoader'));

		expect(next).toHaveBeenCalledExactlyOnceWith(room.id);
	});

	test('keeps loading while it stays in view and the pages add rows', async () => {
		let counter = 0;
		const next = vi.spyOn(chatClient, 'requestMessagesAfter').mockImplementation(() => {
			counter += 1;
			addRow(`more-${counter}`);
			return Promise.resolve();
		});
		renderLoader();

		await triggerObserver(screen.getByTestId('messageForwardLoader'));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		await triggerObserver(screen.getByTestId('messageForwardLoader'));

		expect(next).toHaveBeenCalledTimes(2);
	});

	test('stops asking after a failed page', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const next = vi
			.spyOn(chatClient, 'requestMessagesAfter')
			.mockRejectedValue(new Error('page failed'));
		renderLoader();

		await triggerObserver(screen.getByTestId('messageForwardLoader'));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(errorSpy).toHaveBeenCalledWith(
			'MessageForwardLoader: next page failed',
			expect.any(Error)
		);
		expect(mockIntersectionObserverDisconnect).toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
		// No new observer after the failure: it would ask again at once
		expect((window.IntersectionObserver as unknown as Mock).mock.calls).toHaveLength(1);
	});

	test('asks again, without giving up, when its page was cancelled with a queue that timed out', async () => {
		const cancelled = Object.assign(new Error('window load cancelled'), {
			name: 'QueueCancelledError'
		});
		const next = vi.spyOn(chatClient, 'requestMessagesAfter').mockRejectedValueOnce(cancelled);
		renderLoader();

		await triggerObserver(screen.getByTestId('messageForwardLoader'));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		next.mockImplementationOnce(() => {
			addRow('second');
			return Promise.resolve();
		});
		await triggerObserver(screen.getByTestId('messageForwardLoader'));

		expect(next).toHaveBeenCalledTimes(2);
	});

	test('stops asking after a page that adds no row', async () => {
		const next = vi.spyOn(chatClient, 'requestMessagesAfter').mockResolvedValue();
		renderLoader();

		await triggerObserver(screen.getByTestId('messageForwardLoader'));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(next).toHaveBeenCalledTimes(1);
	});

	test('stops observing on unmount', () => {
		const { unmount } = renderLoader();
		unmount();
		expect(mockIntersectionObserverDisconnect).toHaveBeenCalled();
	});
});
