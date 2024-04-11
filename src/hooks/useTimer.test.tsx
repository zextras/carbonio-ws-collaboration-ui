/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';

import useTimer from './useTimer';

describe('useTimer tests', () => {
	test('Time from now', () => {
		const { result } = renderHook(() => useTimer(Date.now()));
		expect(result.current).toBe('00:00');
		jest.clearAllTimers();
	});

	test('Time from 1 second ago', () => {
		const subtractedDate = Date.now() - 1 * 1000;
		const { result } = renderHook(() => useTimer(subtractedDate));
		expect(result.current).toBe('00:01');
		jest.clearAllTimers();
	});

	test('Time from 1 minute ago', () => {
		const subtractedDate = Date.now() - 1 * 60 * 1000;
		const { result } = renderHook(() => useTimer(subtractedDate));
		expect(result.current).toBe('01:00');
		jest.clearAllTimers();
	});

	test('Time from 1 hour ago', () => {
		const subtractedDate = Date.now() - 1 * 60 * 60 * 1000;
		const { result } = renderHook(() => useTimer(subtractedDate));
		expect(result.current).toBe('01:00:00');
		jest.clearAllTimers();
	});

	test('Time from 1 day ago', () => {
		const subtractedDate = Date.now() - 1 * 24 * 60 * 60 * 1000;
		const { result } = renderHook(() => useTimer(subtractedDate));
		expect(result.current).toBe('24:00:00');
		jest.clearAllTimers();
	});

	test('Time from 12 hours, 30 minutes and 15 seconds ago', () => {
		const subtractedDate = Date.now() - 12 * 60 * 60 * 1000 - 30 * 60 * 1000 - 15 * 1000;
		const { result } = renderHook(() => useTimer(subtractedDate));
		expect(result.current).toBe('12:30:15');
		jest.clearAllTimers();
	});

	test('Initial time from 01:01:01 after 3 seconds', () => {
		jest.useFakeTimers();
		const subtractedDate = Date.now() - 60 * 60 * 1000 - 60 * 1000 - 1000;
		const { result } = renderHook(() => useTimer(subtractedDate));
		act(() => {
			jest.advanceTimersByTime(3000);
		});
		expect(result.current).toBe('01:01:04');
		jest.clearAllTimers();
	});

	test('Initial time 01:59:57 after 4 seconds ', () => {
		jest.useFakeTimers();
		const subtractedDate = Date.now() - 60 * 60 * 1000 - 59 * 60 * 1000 - 57 * 1000;
		const { result } = renderHook(() => useTimer(subtractedDate));
		act(() => {
			jest.advanceTimersByTime(4000);
		});
		expect(result.current).toBe('02:00:01');
		jest.clearAllTimers();
	});
});
