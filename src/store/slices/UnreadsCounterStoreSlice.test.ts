/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';
import { size } from 'lodash';

import {
	createMockConfigurationMessage,
	createMockMarker,
	createMockTextMessage
} from '../../tests/createMock';
import useStore from '../Store';

beforeEach(() => {
	useStore.getState().setLoginInfo('sessionUser', 'Session User');
});
describe('Test unreadsCounter slice', () => {
	test('Add unreadsCounters to the list and check total rooms with unreads', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addUnreadCount('roomOne', 5));
		expect(result.current.unreads.roomOne).toBe(5);
		expect(size(result.current.unreads)).toBe(1);
		act(() => result.current.addUnreadCount('roomTwo', 10));
		expect(result.current.unreads.roomTwo).toBe(10);
		expect(size(result.current.unreads)).toBe(2);
	});

	test('Increment an unread counter of a room', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addUnreadCount('roomOne', 5));
		expect(result.current.unreads.roomOne).toBe(5);
		act(() => result.current.incrementUnreadCount('roomOne'));
		expect(result.current.unreads.roomOne).toBe(6);
	});

	test('Update unreads counter of a room without messages and markers', () => {
		useStore.setState({
			messages: { roomOne: [] },
			markers: { roomOne: {} }
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.updateUnreadCount('roomOne'));
		expect(result.current.unreads.roomOne).toBe(0);
	});

	test('Update unreads counter of a room with messages but no markers', () => {
		useStore.setState({
			messages: {
				roomOne: [
					createMockConfigurationMessage(),
					createMockTextMessage({ from: 'sessionUser' }),
					createMockTextMessage({ from: 'userOne' })
				]
			},
			markers: { roomOne: {} }
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.updateUnreadCount('roomOne'));
		expect(result.current.unreads.roomOne).toBe(2);
	});

	test('Update unreads counter of a room with session marker', () => {
		const now = Date.now();
		useStore.setState({
			messages: {
				roomOne: [
					createMockConfigurationMessage({ id: 'msg1', date: now - 5000 }),
					createMockTextMessage({ id: 'msg2', from: 'sessionUser', date: now - 4000 }),
					createMockTextMessage({ id: 'msg1', from: 'userOne', date: now - 3000 })
				]
			},
			markers: {
				roomOne: {
					sessionUser: createMockMarker({ messageId: 'msg1' })
				}
			}
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.updateUnreadCount('roomOne'));
		expect(result.current.unreads.roomOne).toBe(1);
	});

	test('Update unreads counter of a room with session marker of a message that does not exist or it refers to a fastening', () => {
		const now = Date.now();
		useStore.setState({
			messages: {
				roomOne: [
					createMockConfigurationMessage({ id: 'msg1', date: now - 5000 }),
					createMockTextMessage({ id: 'msg2', from: 'sessionUser', date: now - 4000 }),
					createMockTextMessage({ id: 'msg1', from: 'userOne', date: now - 3000 })
				]
			},
			markers: {
				roomOne: {
					sessionUser: createMockMarker({ messageId: 'fastening1', markerDate: now - 2000 })
				}
			}
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.updateUnreadCount('roomOne'));
		expect(result.current.unreads.roomOne).toBe(0);
	});
});
