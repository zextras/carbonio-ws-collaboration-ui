/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import roomsApi from './RoomsApi';
import { fetchResponse } from '../../../jest-mocks';
import useStore from '../../store/Store';
import {
	createMockCapabilityList,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import { dateToISODate } from '../../utils/dateUtil';

describe('Rooms API', () => {
	test('listRooms is called correctly', async () => {
		// Send listRooms request
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
		const room = createMockRoom({ id: 'room0', name: 'new room', description: 'new description' });
		const roomToAdd = {
			name: room.name!,
			description: room.description!,
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
		// Send getRoom request
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
		// Send updateRoom request
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
		// Send deleteRoom request
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

	test('getURLRoomPicture is called correctly', () => {
		const room = createMockRoom({ id: 'roomId', name: 'new name' });
		const url = roomsApi.getURLRoomPicture(room.id);
		expect(url).toEqual(`http://localhost/services/chats/rooms/roomId/picture`);
	});

	test('getRoomPicture is called correctly', async () => {
		// Send getUserPicture request
		await roomsApi.getRoomPicture('roomId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/picture`, {
			headers,
			method: 'GET',
			body: undefined
		});
	});

	test('updateRoomPicture is called correctly', async () => {
		// Send updateRoomPicture request
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
		// Send updateRoomPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		Object.defineProperty(testFile, 'size', { value: 1024 * 1024 + 1 });

		expect(roomsApi.updateRoomPicture('roomId', testFile)).rejects.toThrowError('File too large');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	test('deleteRoomPicture is called correctly', async () => {
		// Send deleteRoomPicture request
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
		// Send muteRoomNotification request
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
		// Send unmuteRoomNotification request
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
		// Send clearRoomHistory request
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

	test('getRoomMembers is called correctly', async () => {
		// Send getRoomMembers request
		await roomsApi.getRoomMembers('roomId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/members`, {
			method: 'GET',
			headers,
			body: undefined
		});
	});

	test('addRoomMember is called correctly', async () => {
		// Send addRoomMember request
		const member = {
			userId: 'userId',
			owner: false,
			historyCleared: true
		};
		await roomsApi.addRoomMember('roomId', member);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/members`, {
			method: 'POST',
			headers,
			body: JSON.stringify(member)
		});
	});

	test('deleteRoomMember is called correctly', async () => {
		// Send deleteRoomMember request
		await roomsApi.deleteRoomMember('roomId', 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/members/userId`, {
			method: 'DELETE',
			headers,
			body: undefined
		});
	});

	test('promoteRoomMember is called correctly', async () => {
		// Send promoteRoomMember request
		await roomsApi.promoteRoomMember('roomId', 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/members/userId/owner`, {
			method: 'PUT',
			headers,
			body: undefined
		});
	});

	test('demotesRoomMember is called correctly', async () => {
		// Send demotesRoomMember request
		await roomsApi.demotesRoomMember('roomId', 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/members/userId/owner`, {
			method: 'DELETE',
			headers,
			body: undefined
		});
	});

	test('getRoomAttachments is called correctly', async () => {
		// Send getRoomAttachments request
		await roomsApi.getRoomAttachments('roomId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/attachments`, {
			headers,
			method: 'GET',
			body: undefined
		});
	});

	test('getRoomAttachments is called correctly with params', async () => {
		// Send getRoomAttachments request
		await roomsApi.getRoomAttachments('roomId', 3, 'filter');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/rooms/roomId/attachments?itemsNumber=3&extraFields=filter`,
			{
				headers,
				method: 'GET',
				body: undefined
			}
		);
	});

	test('addRoomAttachment is called correctly', async () => {
		// Send addRoomAttachments request
		const testFile = new File([], 'file.pdf', { type: 'application/pdf' });
		const { signal } = new AbortController();
		await roomsApi.addRoomAttachment('roomId', testFile, {}, signal);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('fileName', 'ZmlsZS5wZGY='); // Base64 of 'file.pdf'
		headers.append('mimeType', testFile.type);
		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/attachments`, {
			method: 'POST',
			headers,
			body: new ArrayBuffer(0),
			signal
		});
	});

	test('addRoomAttachment is called correctly with optionalParams', async () => {
		// Send addRoomAttachments request
		const testFile = new File([], 'file.pdf', { type: 'application/pdf' });
		const { signal } = new AbortController();
		await roomsApi.addRoomAttachment(
			'roomId',
			testFile,
			{ description: 'description', replyId: 'stanzaId' },
			signal
		);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('fileName', 'ZmlsZS5wZGY='); // Base64 of 'file.pdf'
		headers.append('mimeType', testFile.type);
		headers.append('description', 'ZGVzY3JpcHRpb24='); // Base64 of 'description'
		headers.append('replyId', 'stanzaId');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/attachments`, {
			method: 'POST',
			headers,
			body: new ArrayBuffer(0),
			signal
		});
	});

	test('forwardMessages is called correctly', async () => {
		// Send addRoom request
		const message = createMockTextMessage();
		const forwardedMessage = {
			originalMessage: undefined,
			originalMessageSentAt: dateToISODate(message.date)
		};
		await roomsApi.forwardMessages(['roomId'], [message]);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/forward`, {
			method: 'POST',
			headers,
			body: JSON.stringify([forwardedMessage])
		});
	});
});
