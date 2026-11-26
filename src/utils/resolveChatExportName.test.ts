/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { resolveChatExportName } from './resolveChatExportName';
import { getUser } from '../network/apis/UsersApi';
import useStore from '../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../tests/createMock';
import { RoomType } from '../types/store/RoomTypes';

vi.mock('../network/apis/UsersApi');

const loggedUser = createMockUser({ id: 'logged-user', name: 'Logged User' });
const otherUser = createMockUser({
	id: 'other-user',
	name: 'Other User',
	email: 'other@user.com'
});

const groupRoomId = 'group';
const groupRoom = createMockRoom({ id: groupRoomId, type: RoomType.GROUP, name: 'Group Room' });

const oneToOneRoomId = 'one-to-one';
const oneToOneRoom = createMockRoom({
	id: oneToOneRoomId,
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: loggedUser.id }), createMockMember({ userId: otherUser.id })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: loggedUser.id, name: loggedUser.name });
	store.addRooms([groupRoom, oneToOneRoom]);
});

describe('resolveChatExportName', () => {
	test('returns the room name immediately for a group room, without hitting the network', async () => {
		const name = await resolveChatExportName(groupRoomId);

		expect(name).toBe(groupRoom.name);
		expect(getUser).not.toHaveBeenCalled();
	});

	test('returns the already-hydrated other member name for a 1:1 room, without hitting the network', async () => {
		useStore.getState().setUserInfo([otherUser]);

		const name = await resolveChatExportName(oneToOneRoomId);

		expect(name).toBe(otherUser.name);
		expect(getUser).not.toHaveBeenCalled();
	});

	test('fetches the other member directly when not yet hydrated in store', async () => {
		vi.mocked(getUser).mockResolvedValue(otherUser);

		const name = await resolveChatExportName(oneToOneRoomId);

		expect(getUser).toHaveBeenCalledWith(otherUser.id);
		expect(name).toBe(otherUser.name);
	});

	test('falls back to the roomId when the direct fetch fails', async () => {
		// A failed resolution is expected to log a warning, not throw
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.mocked(getUser).mockRejectedValue(new Error('network error'));

		const name = await resolveChatExportName(oneToOneRoomId);

		expect(name).toBe(oneToOneRoomId);
	});

	test('falls back to the roomId when the direct fetch times out', async () => {
		// A timed-out resolution is expected to log a warning, not throw
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.mocked(getUser).mockReturnValue(new Promise(() => {})); // never resolves

		const namePromise = resolveChatExportName(oneToOneRoomId);
		await vi.advanceTimersByTimeAsync(1500);

		await expect(namePromise).resolves.toBe(oneToOneRoomId);
	});

	test('falls back to the roomId for an unknown room (e.g. not yet in store)', async () => {
		const name = await resolveChatExportName('unknown-room');

		expect(name).toBe('unknown-room');
		expect(getUser).not.toHaveBeenCalled();
	});
});
