/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import roomsApi from './RoomsApi';
import useStore from '../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import { fetchResponse } from '../../tests/mocks/global';
import { RoomType } from '../../types/store/RoomTypes';
import { dateToISODate } from '../../utils/dateUtils';
import { getTagElement } from '../xmpp/utility/decodeStanza';
import HistoryAccumulator from '../xmpp/utility/HistoryAccumulator';
import { textMessageFromHistory } from '../xmpp/xmppMessageExamples';

const contentType = 'Content-Type';
const applicationJson = 'application/json';
const applicationPdf = 'application/pdf';

describe('Rooms API', () => {
	test('listRooms is called correctly', async () => {
		// Send listRooms request
		const room = createMockRoom({ id: 'room0' });
		fetchResponse.mockResolvedValueOnce([room]);
		await roomsApi.listRooms(true, true);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenNthCalledWith(1, `/services/chats/rooms`, {
			method: 'POST',
			headers,
			body: JSON.stringify(roomToAdd)
		});
		expect(global.fetch).toHaveBeenNthCalledWith(
			2,
			`/services/chats/meetings`,
			expect.objectContaining({ method: 'POST' })
		);
	});

	test('getRoom is called correctly', async () => {
		// Send getRoom request
		const room = createMockRoom({ id: 'room0' });
		fetchResponse.mockResolvedValueOnce(room);
		await roomsApi.getRoom(room.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/room0`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({ name: 'new name' })
		});
	});

	test('deleteRoom is called correctly', async () => {
		const room = createMockRoom();
		// Send deleteRoom request
		await roomsApi.deleteRoom(room.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/${room.id}`, {
			method: 'DELETE',
			headers,
			body: undefined
		});
	});

	test('deleteRoomAndMeeting without an associated meeting is called correctly', async () => {
		const room = createMockRoom();
		// Send deleteRoom request
		await roomsApi.deleteRoomAndMeeting(room.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/${room.id}`, {
			method: 'DELETE',
			headers,
			body: undefined
		});
	});

	test('deleteRoomAndMeeting with an associated meeting is called correctly', async () => {
		const room = createMockRoom();
		const meeting = createMockMeeting({ roomId: room.id });
		useStore.getState().addMeeting(meeting);
		// Send deleteRoom request
		await roomsApi.deleteRoomAndMeeting(room.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenNthCalledWith(
			1,
			`/services/chats/meetings/${meeting.id}`,
			expect.objectContaining({ method: 'DELETE' })
		);

		expect(global.fetch).toHaveBeenNthCalledWith(2, `/services/chats/rooms/${room.id}`, {
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
		headers.append(contentType, applicationJson);

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
		headers.append('fileName', '\\u0069\\u006d\\u0061\\u0067\\u0065\\u002e\\u0070\\u006e\\u0067'); // Unicode of 'image.png'
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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		headers.append(contentType, applicationJson);

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
		const testFile = new File([], 'file.pdf', { type: applicationPdf });
		const { signal } = new AbortController();
		const area = '0x0';
		await roomsApi.addRoomAttachment('roomId', testFile, { area }, signal);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('fileName', '\\u0066\\u0069\\u006c\\u0065\\u002e\\u0070\\u0064\\u0066'); // Unicode of 'file.pdf'
		headers.append('mimeType', testFile.type);
		headers.append('messageId', '00000000-0000-4000-8000-000000000000');
		headers.append('area', area);

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
		const testFile = new File([], 'file.pdf', { type: applicationPdf });
		const { signal } = new AbortController();
		const area = '0x0';
		await roomsApi.addRoomAttachment(
			'roomId',
			testFile,
			{ description: 'description', replyId: 'stanzaId', area },
			signal
		);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('fileName', '\\u0066\\u0069\\u006c\\u0065\\u002e\\u0070\\u0064\\u0066'); // Unicode of 'file.pdf'
		headers.append('mimeType', testFile.type);
		headers.append(
			'description',
			'\\u0064\\u0065\\u0073\\u0063\\u0072\\u0069\\u0070\\u0074\\u0069\\u006f\\u006e'
		); // Unicode of 'description'
		headers.append('replyId', 'stanzaId');
		headers.append('messageId', '00000000-0000-4000-8000-000000000000');
		headers.append('area', area);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/attachments`, {
			method: 'POST',
			headers,
			body: new ArrayBuffer(0),
			signal
		});
	});

	test('addRoomAttachment is called correctly with placeholderRoom', async () => {
		fetchResponse.mockResolvedValueOnce(createMockRoom({ id: 'room0' }));
		fetchResponse.mockResolvedValueOnce(createMockMeeting({ id: 'meeting0' }));
		// Send addRoomAttachments request
		const testFile = new File([], 'file.pdf', { type: applicationPdf });
		const { signal } = new AbortController();
		const area = '0x0';
		await roomsApi.addRoomAttachment('placeholder-userId', testFile, { area }, signal);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(global.fetch).toHaveBeenNthCalledWith(1, `/services/chats/rooms`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				type: RoomType.ONE_TO_ONE,
				membersIds: ['userId']
			})
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
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/forward`, {
			method: 'POST',
			headers,
			body: JSON.stringify([forwardedMessage])
		});
	});

	test('forwardMessages - edited message - is called correctly', async () => {
		// Send addRoom request
		const messageEdited = createMockTextMessage();
		const msgToParse = textMessageFromHistory.replace(
			'2023-03-20T13:58:29.599694Z',
			dateToISODate(messageEdited.date)
		);
		const parser = new DOMParser();
		const xmlParsed: any = parser.parseFromString(msgToParse, 'application/xml');
		const result = getTagElement(xmlParsed, 'result');
		const messageParsed = getTagElement(result!, 'message');
		const messageResult = getTagElement(result!, 'message');
		messageResult!.getElementsByTagName('body')[0].innerHTML = messageEdited.text;

		HistoryAccumulator.addReferenceForForwardedMessage(messageEdited.stanzaId, messageParsed!);

		const forwardedMessage = {
			originalMessage: messageResult?.outerHTML,
			originalMessageSentAt: dateToISODate(messageEdited.date)
		};

		await roomsApi.forwardMessages(['roomId'], [messageEdited]);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/rooms/roomId/forward`, {
			method: 'POST',
			headers,
			body: JSON.stringify([forwardedMessage])
		});
	});

	test('replacePlaceholderRoom is called correctly', async () => {
		// Send replacePlaceholderRoom request
		const room = createMockRoom({ id: 'room0' });
		const testFile = new File([], 'file.pdf', { type: applicationPdf });
		fetchResponse.mockResolvedValueOnce(room);
		await roomsApi.replacePlaceholderRoom('userId', 'text', testFile);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenNthCalledWith(1, `/services/chats/rooms`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				type: RoomType.ONE_TO_ONE,
				membersIds: ['userId']
			})
		});
	});
});
