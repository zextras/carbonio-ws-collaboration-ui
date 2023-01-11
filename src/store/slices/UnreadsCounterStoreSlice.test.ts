/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { size } from 'lodash';

import useStore from '../Store';

describe('Test unreadsCounter slice', () => {
	it('add unreadsCounters to the list and check total rooms with unreads', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addUnreadCount('roomOne', 5));
		expect(result.current.unreads.roomOne).toBe(5);
		expect(size(result.current.unreads)).toBe(1);
		act(() => result.current.addUnreadCount('roomTwo', 10));
		expect(result.current.unreads.roomTwo).toBe(10);
		expect(size(result.current.unreads)).toBe(2);
	});
	it('increment an unread counter of a room', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addUnreadCount('roomOne', 5));
		expect(result.current.unreads.roomOne).toBe(5);
		act(() => result.current.incrementUnreadCount('roomOne'));
		expect(result.current.unreads.roomOne).toBe(6);
	});
});
