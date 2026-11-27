/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import useReadMarker from './useReadMarker';
import { PLACEHOLDER_STANZA_PREFIX } from '../../../constants/messageConstants';
import { chatClient } from '../../../network/chatClient/ChatClient';
import useStore from '../../../store/Store';
import { createMockMarker, createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { MarkerStatus } from '../../../types/store/ChatsRegistryTypes';

const room = createMockRoom({ id: 'read-room' });
const me = 'me';

const otherMsg = createMockTextMessage({ id: 'o1', roomId: room.id, from: 'other', date: 100 });
const myMsg = createMockTextMessage({ id: 'm1', roomId: room.id, from: me, date: 200 });

const scrollerRef = { current: null };

let readSpy: ReturnType<typeof vi.spyOn>;
let hasFocus: ReturnType<typeof vi.spyOn>;
let visibility: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	readSpy = vi.spyOn(chatClient, 'readMessage').mockResolvedValue(true);
	hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
	visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
	const store = useStore.getState();
	store.setLoginInfo({ id: me, name: 'Me' });
	store.setApiVersion('2.0.0');
	store.addRooms([room]);
});

describe('useReadMarker on a WSC-pure backend', () => {
	test('marks the room read up to my own last message', async () => {
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		renderHook(() => useReadMarker(room.id, scrollerRef));
		expect(readSpy).toHaveBeenCalledTimes(1);
		expect(readSpy).toHaveBeenCalledWith(room.id, myMsg.id);
	});

	test('uses the newest persisted row when the last one is a placeholder', () => {
		const placeholder = createMockTextMessage({
			id: 'tmp',
			roomId: room.id,
			from: me,
			date: 300,
			stanzaId: `${PLACEHOLDER_STANZA_PREFIX}tmp`,
			read: MarkerStatus.PENDING
		});
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg, placeholder]));
		renderHook(() => useReadMarker(room.id, scrollerRef));
		expect(readSpy).toHaveBeenCalledWith(room.id, myMsg.id);
	});

	test('does not send when the document has no focus', () => {
		hasFocus.mockReturnValue(false);
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		renderHook(() => useReadMarker(room.id, scrollerRef));
		expect(readSpy).not.toHaveBeenCalled();
	});

	test('does not send when the page is hidden', () => {
		visibility.mockReturnValue('hidden');
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		renderHook(() => useReadMarker(room.id, scrollerRef));
		expect(readSpy).not.toHaveBeenCalled();
	});

	test('does not depend on the composer focus', () => {
		act(() => {
			useStore.getState().updateHistory(room.id, [otherMsg, myMsg]);
			useStore.getState().setInputHasFocus(room.id, false);
		});
		renderHook(() => useReadMarker(room.id, scrollerRef));
		expect(readSpy).toHaveBeenCalledTimes(1);
	});

	test('does not send when my marker is already at the target', () => {
		act(() => {
			useStore.getState().updateHistory(room.id, [otherMsg, myMsg]);
			useStore
				.getState()
				.updateReadStatus(room.id, [
					createMockMarker({ from: me, messageId: myMsg.id, markerDate: myMsg.date })
				]);
		});
		renderHook(() => useReadMarker(room.id, scrollerRef));
		expect(readSpy).not.toHaveBeenCalled();
	});

	test('does not repeat a request already made for the same target', () => {
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		const { result } = renderHook(() => useReadMarker(room.id, scrollerRef));
		act(() => result.current());
		act(() => result.current());
		expect(readSpy).toHaveBeenCalledTimes(1);
	});

	test('sends again when a newer row arrives', () => {
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		renderHook(() => useReadMarker(room.id, scrollerRef));
		const newer = createMockTextMessage({ id: 'o2', roomId: room.id, from: 'other', date: 400 });
		act(() => useStore.getState().newMessage(newer));
		expect(readSpy).toHaveBeenCalledTimes(2);
		expect(readSpy).toHaveBeenLastCalledWith(room.id, newer.id);
	});

	test('forgets the local request when it fails, so the next trigger retries', async () => {
		readSpy.mockResolvedValueOnce(false);
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		const { result } = renderHook(() => useReadMarker(room.id, scrollerRef));
		await act(async () => {
			await Promise.resolve();
		});
		act(() => result.current());
		expect(readSpy).toHaveBeenCalledTimes(2);
	});

	test('retries when the page becomes visible again', () => {
		hasFocus.mockReturnValue(false);
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		renderHook(() => useReadMarker(room.id, scrollerRef));
		expect(readSpy).not.toHaveBeenCalled();
		hasFocus.mockReturnValue(true);
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
		});
		expect(readSpy).toHaveBeenCalledTimes(1);
	});

	test('retries when the window regains focus', () => {
		hasFocus.mockReturnValue(false);
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		renderHook(() => useReadMarker(room.id, scrollerRef));
		hasFocus.mockReturnValue(true);
		act(() => {
			window.dispatchEvent(new Event('focus'));
		});
		expect(readSpy).toHaveBeenCalledTimes(1);
	});

	test('uses the saved scroll position when the list is not at the bottom', () => {
		act(() => {
			useStore.getState().updateHistory(room.id, [otherMsg, myMsg]);
			useStore.getState().setScrollPosition(room.id, otherMsg.id);
		});
		const scrolledUp = {
			current: { scrollHeight: 1000, scrollTop: 0, clientHeight: 200 } as HTMLElement
		};
		renderHook(() => useReadMarker(room.id, scrolledUp));
		expect(readSpy).toHaveBeenCalledWith(room.id, otherMsg.id);
	});
});

describe('useReadMarker on a v1 backend', () => {
	test('never sends anything', () => {
		useStore.getState().setApiVersion('1.6.0');
		act(() => useStore.getState().updateHistory(room.id, [otherMsg, myMsg]));
		renderHook(() => useReadMarker(room.id, scrollerRef));
		expect(readSpy).not.toHaveBeenCalled();
	});
});
