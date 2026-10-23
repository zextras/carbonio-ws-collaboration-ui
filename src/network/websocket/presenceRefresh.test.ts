/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { refreshPresence, refreshPresenceOfStoredRooms } from './presenceRefresh';
import useStore from '../../store/Store';
import { createMockMember, createMockRoom } from '../../tests/createMock';
import { wscSdk } from '../sdk/wscSdk';

describe('presenceRefresh', () => {
	beforeEach(() => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
	});

	test('drops the current user and calls the SDK once with the others', () => {
		const spy = vi.spyOn(wscSdk, 'fetchPresence').mockResolvedValue(undefined);

		refreshPresence(['me', 'a', 'b']);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(['a', 'b']);
	});

	test('does not call the SDK without users', () => {
		const spy = vi.spyOn(wscSdk, 'fetchPresence').mockResolvedValue(undefined);
		refreshPresence(['me']);
		expect(spy).not.toHaveBeenCalled();
	});

	test('swallows failures', async () => {
		vi.spyOn(wscSdk, 'fetchPresence').mockRejectedValue(new Error('boom'));
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		refreshPresence(['a']);
		await vi.waitFor(() => expect(errSpy).toHaveBeenCalled());
	});

	test('stored rooms: members of every room except the current user, in one call', () => {
		const spy = vi.spyOn(wscSdk, 'fetchPresence').mockResolvedValue(undefined);
		useStore.getState().addRooms([
			createMockRoom({
				id: 'r1',
				members: [createMockMember({ userId: 'a' }), createMockMember({ userId: 'me' })]
			}),
			createMockRoom({
				id: 'r2',
				members: [createMockMember({ userId: 'a' }), createMockMember({ userId: 'b' })]
			})
		]);

		refreshPresenceOfStoredRooms();

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(['a', 'a', 'b']);
	});
});
