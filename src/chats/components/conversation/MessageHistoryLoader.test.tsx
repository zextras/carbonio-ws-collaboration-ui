/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import type { Mock } from 'vitest';

import MessageHistoryLoader from './MessageHistoryLoader';
import { PLACEHOLDER_STANZA_PREFIX } from '../../../constants/messageConstants';
import { chatClient } from '../../../network/chatClient/ChatClient';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import {
	mockIntersectionObserverDisconnect,
	mockIntersectionObserverObserve
} from '../../../tests/setupTests';
import { setup } from '../../../tests/test-utils';
import { MarkerStatus } from '../../../types/store/ChatsRegistryTypes';

describe('MessageHistoryLoader - IntersectionObserver behaviour', () => {
	test('Intersection observer is created on MessageHistoryLoader mount', () => {
		const ref = React.createRef<HTMLDivElement>();
		setup(
			<>
				<div ref={ref} />
				<MessageHistoryLoader roomId={'roomId'} messageListRef={ref} />
			</>
		);
		expect(mockIntersectionObserverObserve).toBeCalledTimes(1);
	});

	test('Intersection observer stops observing on MessageHistoryLoader unmount', () => {
		const ref = React.createRef<HTMLDivElement>();
		const { unmount } = setup(
			<>
				<div ref={ref} />
				<MessageHistoryLoader roomId={'roomId'} messageListRef={ref} />
			</>
		);
		unmount();
		expect(mockIntersectionObserverDisconnect).toBeCalledTimes(1);
	});
});

describe('MessageHistoryLoader - anchor of the backward page', () => {
	const ANCHOR_ROOM = 'room-anchor';
	const triggerLoader = async (roomId: string): Promise<void> => {
		vi.useFakeTimers();
		const ref = React.createRef<HTMLDivElement>();
		setup(
			<>
				<div ref={ref} />
				<MessageHistoryLoader roomId={roomId} messageListRef={ref} />
			</>
		);
		const observer = (window.IntersectionObserver as unknown as Mock).mock.calls[0][0];
		observer([{ intersectionRatio: 1 }]);
		await act(() => vi.advanceTimersByTimeAsync(600));
		vi.useRealTimers();
	};

	const placeholder = createMockTextMessage({
		id: 'tmp-1',
		stanzaId: `${PLACEHOLDER_STANZA_PREFIX}tmp-1`,
		roomId: ANCHOR_ROOM,
		date: 1000,
		read: MarkerStatus.PENDING
	});

	test('A pending placeholder written back with an older date is not the anchor', async () => {
		useStore.getState().addRooms([createMockRoom({ id: ANCHOR_ROOM })]);
		useStore
			.getState()
			.updateHistory(ANCHOR_ROOM, [
				placeholder,
				createMockTextMessage({ id: 'm-real', roomId: ANCHOR_ROOM, date: 5000 })
			]);
		const requestSpy = vi.spyOn(chatClient, 'requestHistory').mockImplementation(() => undefined);

		await triggerLoader(ANCHOR_ROOM);

		expect(requestSpy).toHaveBeenCalledWith(ANCHOR_ROOM, 5000);
	});

	test('With only pending placeholders in store the anchor falls back to now', async () => {
		useStore.getState().addRooms([createMockRoom({ id: ANCHOR_ROOM })]);
		useStore.getState().updateHistory(ANCHOR_ROOM, [placeholder]);
		const requestSpy = vi.spyOn(chatClient, 'requestHistory').mockImplementation(() => undefined);

		await triggerLoader(ANCHOR_ROOM);

		expect(requestSpy).toHaveBeenCalledTimes(1);
		expect(requestSpy.mock.calls[0][1]).toBeGreaterThan(1000);
	});
});
