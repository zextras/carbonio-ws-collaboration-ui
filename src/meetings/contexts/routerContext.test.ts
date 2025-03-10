/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook, act } from '@testing-library/react';

import { useRouterContextSetup, MEETINGS_ROUTES, PAGE_INFO_TYPE } from './routerContext';

describe('useRouterContextSetup', () => {
	test('should initialize with default values', () => {
		const { result } = renderHook(() => useRouterContextSetup());

		expect(result.current.route).toBe(MEETINGS_ROUTES.MAIN);
		expect(result.current.infoType).toBeUndefined();
		expect(result.current.meetingId).toBeUndefined();
	});

	test('should navigate to a new route with infoType', () => {
		const { result } = renderHook(() => useRouterContextSetup());

		act(() => {
			result.current.navigate({
				route: MEETINGS_ROUTES.INFO,
				infoType: PAGE_INFO_TYPE.MEETING_ENDED
			});
		});

		expect(result.current.route).toBe(MEETINGS_ROUTES.INFO);
		expect(result.current.infoType).toBe(PAGE_INFO_TYPE.MEETING_ENDED);
		expect(result.current.meetingId).toBeUndefined();
	});

	test('should navigate to a new route with meetingId', () => {
		const { result } = renderHook(() => useRouterContextSetup());

		act(() => {
			result.current.navigate({ route: MEETINGS_ROUTES.MEETING, meetingId: 'meetingId' });
		});

		expect(result.current.route).toBe(MEETINGS_ROUTES.MEETING);
		expect(result.current.meetingId).toBe('meetingId');
		expect(result.current.infoType).toBeUndefined();
	});

	test('should reset infoType and meetingId when navigating to MAIN', () => {
		const { result } = renderHook(() => useRouterContextSetup());

		act(() => {
			result.current.navigate({
				route: MEETINGS_ROUTES.INFO,
				infoType: PAGE_INFO_TYPE.MEETING_ENDED
			});
		});

		act(() => {
			result.current.navigate({ route: MEETINGS_ROUTES.MAIN });
		});

		expect(result.current.route).toBe(MEETINGS_ROUTES.MAIN);
		expect(result.current.infoType).toBeUndefined();
		expect(result.current.meetingId).toBeUndefined();
	});
});
