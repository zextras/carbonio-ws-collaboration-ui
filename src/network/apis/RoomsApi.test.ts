/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fetchResponse } from '../../../jest-mocks';
import useStore from '../../store/Store';
import { createMockCapabilityList, createMockRoom } from '../../tests/createMock';
import roomsApi from './RoomsApi';

describe('Rooms API', () => {
	test('listRooms is called correctly', async () => {
		// Send getUser request
		const room = createMockRoom({ id: 'room0' });
		fetchResponse.mockResolvedValueOnce([room]);
		await roomsApi.listRooms(true, true);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/rooms?extraFields=members&extraFields=settings`,
			{
				method: 'GET',
				headers,
				body: undefined
			}
		);

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.rooms[room.id]).toEqual(room);
	});

	test('addRoom is called correctly', async () => {
		// Send addRoom request
		const room = createMockRoom({ id: 'room0' });
		const roomToAdd = {
			name: room.name,
			description: room.description,
			type: room.type,
			membersIds: []
		};
		fetchResponse.mockResolvedValueOnce(room);
		await roomsApi.addRoom(roomToAdd);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms`, {
			method: 'POST',
			headers,
			body: JSON.stringify(roomToAdd)
		});
	});

	test('getRoom is called correctly', async () => {
		// Send addRoom request
		const room = createMockRoom({ id: 'room0' });
		fetchResponse.mockResolvedValueOnce(room);
		await roomsApi.getRoom(room.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/room0`, {
			method: 'GET',
			headers,
			body: undefined
		});
	});

	test('updateRoom is called correctly', async () => {
		// Send addRoom request
		const room = createMockRoom({ id: 'room0', name: 'new name' });
		fetchResponse.mockResolvedValueOnce(room);
		await roomsApi.updateRoom(room.id, { name: 'new name' });

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/room0`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({ name: 'new name' })
		});
	});

	test('deleteRoom is called correctly', async () => {
		// Send addRoom request
		await roomsApi.deleteRoom('roomId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId`, {
			method: 'DELETE',
			headers,
			body: undefined
		});
	});

	test('updateRoomPicture is called correctly', async () => {
		// Send getUser request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		await roomsApi.updateRoomPicture('roomId', testFile);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('fileName', 'aW1hZ2UucG5n'); // Base64 of 'image.png'
		headers.append('mimeType', testFile.type);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/picture`, {
			method: 'PUT',
			headers,
			body: new ArrayBuffer(0)
		});
	});

	test('updateRoomPicture is called with a file too large', async () => {
		// Set maxRoomImageSizeInKb to 512kb
		const store = useStore.getState();
		store.setCapabilities(createMockCapabilityList({ maxRoomImageSizeInKb: 512 }));
		// Send getUser request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		Object.defineProperty(testFile, 'size', { value: 1024 * 1024 + 1 });

		expect(roomsApi.updateRoomPicture('roomId', testFile)).rejects.toThrowError('File too large');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	test('deleteRoomPicture is called correctly', async () => {
		// Send getUser request
		await roomsApi.deleteRoomPicture('roomId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/picture`, {
			headers,
			method: 'DELETE',
			body: undefined
		});
	});

	test('muteRoomNotification is called correctly', async () => {
		// Send addRoom request
		await roomsApi.muteRoomNotification('roomId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/mute`, {
			method: 'PUT',
			headers,
			body: undefined
		});
	});

	test('unmuteRoomNotification is called correctly', async () => {
		// Send addRoom request
		await roomsApi.unmuteRoomNotification('roomId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/mute`, {
			method: 'DELETE',
			headers,
			body: undefined
		});
	});

	test('clearRoomHistory is called correctly', async () => {
		// Send addRoom request
		await roomsApi.clearRoomHistory('roomId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/clear`, {
			method: 'PUT',
			headers,
			body: undefined
		});
	});
});
