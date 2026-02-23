/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import roomsApi from './RoomsApi';
import useStore from '../../store/Store';
import { buildTextMessageFromHistory } from '../../tests/buildXmppStanza';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { RoomType } from '../../types/store/RoomTypes';
import {
	mockFetchAPI,
	mockSendFileFetchAPI,
	mockUploadFileFetchAPI
} from '../../utils/__mocks__/FetchUtils';
import { dateToISODate } from '../../utils/dateUtils';
import HistoryAccumulator from '../xmpp/utility/HistoryAccumulator';

const contentType = 'Content-Type';
const applicationJson = 'application/json';
const applicationPdf = 'application/pdf';
const roomId = 'roomId';
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

vi.mock('../../utils/FetchUtils');

describe('Rooms API', () => {
	test('listRooms is called correctly', async () => {
		// Send listRooms request
		const room = createMockRoom({ id: 'room0' });
		mockFetchAPI.mockResolvedValueOnce([room]);
		await roomsApi.listRooms(true, true);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			'rooms?extraFields=members&extraFields=settings',
			RequestType.GET
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
			members: []
		};

		await roomsApi.addRoom(roomToAdd);

		expect(mockFetchAPI).toHaveBeenCalledWith('rooms', RequestType.POST, roomToAdd);
		expect(mockFetchAPI).toHaveBeenLastCalledWith('meetings', RequestType.POST, {
			meetingType: MeetingType.PERMANENT,
			name: ''
		});
	});

	test('getRoom is called correctly', async () => {
		// Send getRoom request
		const room = createMockRoom({ id: 'room0' });
		mockFetchAPI.mockResolvedValueOnce(room);
		await roomsApi.getRoom(room.id);

		expect(mockFetchAPI).toHaveBeenCalledWith('rooms/room0', RequestType.GET);
	});

	test('updateRoom is called correctly', async () => {
		// Send updateRoom request
		const room = createMockRoom({ id: 'room0', name: 'new name' });
		mockFetchAPI.mockResolvedValueOnce(room);
		await roomsApi.updateRoom(room.id, { name: 'new name' });

		expect(mockFetchAPI).toHaveBeenCalledWith('rooms/room0', RequestType.PUT, { name: 'new name' });
	});

	test('deleteRoom is called correctly', async () => {
		const room = createMockRoom();
		// Send deleteRoom request
		await roomsApi.deleteRoom(room.id);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${room.id}`, RequestType.DELETE);
	});

	test('deleteRoomAndMeeting without an associated meeting is called correctly', async () => {
		const room = createMockRoom();
		// Send deleteRoom request
		await roomsApi.deleteRoomAndMeeting(room.id);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${room.id}`, RequestType.DELETE);
	});

	test('deleteRoomAndMeeting with an associated meeting is called correctly', async () => {
		const room = createMockRoom();
		const meeting = createMockMeeting({ roomId: room.id });
		useStore.getState().addMeetings([meeting]);
		// Send deleteRoom request
		await roomsApi.deleteRoomAndMeeting(room.id);

		expect(mockFetchAPI).toHaveBeenNthCalledWith(1, `meetings/${meeting.id}`, RequestType.DELETE);
		expect(mockFetchAPI).toHaveBeenNthCalledWith(2, `rooms/${room.id}`, RequestType.DELETE);
	});

	test('getURLRoomPicture is called correctly', () => {
		const room = createMockRoom({ id: roomId, name: 'new name' });
		const url = roomsApi.getURLRoomPicture(room.id);

		expect(url).toEqual(`http://localhost/services/chats/rooms/${roomId}/picture`);
	});

	test('getRoomPicture is called correctly', async () => {
		// Send getUserPicture request
		await roomsApi.getRoomPicture('roomId');

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/roomId/picture`, RequestType.GET);
	});

	test('updateRoomPicture is called correctly', async () => {
		mockUploadFileFetchAPI.mockResolvedValue(true);
		// Send updateRoomPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		await roomsApi.updateRoomPicture(roomId, testFile);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('fileName', '\\u0069\\u006d\\u0061\\u0067\\u0065\\u002e\\u0070\\u006e\\u0067'); // Unicode of 'image.png'
		headers.append('mimeType', testFile.type);

		expect(mockUploadFileFetchAPI).toHaveBeenCalledWith(
			`rooms/${roomId}/picture`,
			RequestType.PUT,
			testFile
		);
	});

	test('updateRoomPicture is called with a file too large', async () => {
		// Set maxRoomImageSizeInKb to 2MB
		const store = useStore.getState();
		store.setAttributes(createMockAttributesList({ carbonioWscMaxRoomPictureSize: '2' }));
		// Send updateRoomPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		Object.defineProperty(testFile, 'size', { value: 1024 * 1024 * 3 });

		await expect(roomsApi.updateRoomPicture(roomId, testFile)).rejects.toThrowError(
			'File too large'
		);
		expect(mockFetchAPI).not.toHaveBeenCalled();
	});

	test('deleteRoomPicture is called correctly', async () => {
		// Send deleteRoomPicture request
		await roomsApi.deleteRoomPicture(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/picture`, RequestType.DELETE);
	});

	test('muteRoomNotification is called correctly', async () => {
		// Send muteRoomNotification request
		await roomsApi.muteRoomNotification(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/mute`, RequestType.PUT);
	});

	test('unmuteRoomNotification is called correctly', async () => {
		// Send unmuteRoomNotification request
		await roomsApi.unmuteRoomNotification(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/mute`, RequestType.DELETE);
	});

	test('clearRoomHistory is called correctly', async () => {
		// Send clearRoomHistory request
		await roomsApi.clearRoomHistory(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/clear`, RequestType.PUT);
	});

	test('getRoomMembers is called correctly', async () => {
		// Send getRoomMembers request
		await roomsApi.getRoomMembers(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/members`, RequestType.GET);
	});

	test('addRoomMember is called correctly', async () => {
		// Send addRoomMember request
		const member = [
			{
				userId: 'userId',
				owner: false,
				historyCleared: true
			}
		];
		await roomsApi.addRoomMembers(roomId, member);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/members`, RequestType.POST, member);
	});

	test('deleteRoomMember is called correctly', async () => {
		// Send deleteRoomMember request
		await roomsApi.deleteRoomMember(roomId, 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/members/userId`, RequestType.DELETE);
	});

	test('promoteRoomMember is called correctly', async () => {
		// Send promoteRoomMember request
		await roomsApi.promoteRoomMember(roomId, 'userId');

		expect(mockFetchAPI).toHaveBeenCalledWith(
			`rooms/${roomId}/members/userId/owner`,
			RequestType.PUT
		);
	});

	test('demotesRoomMember is called correctly', async () => {
		// Send demotesRoomMember request
		await roomsApi.demotesRoomMember('roomId', 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			`rooms/roomId/members/userId/owner`,
			RequestType.DELETE
		);
	});

	test('getRoomAttachments is called correctly', async () => {
		// Send getRoomAttachments request
		await roomsApi.getRoomAttachments('roomId');

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/roomId/attachments`, RequestType.GET);
	});

	test('getRoomAttachments is called correctly with params', async () => {
		// Send getRoomAttachments request
		await roomsApi.getRoomAttachments('roomId', 3, 'filter');

		expect(mockFetchAPI).toHaveBeenCalledWith(
			`rooms/roomId/attachments?itemsNumber=3&extraFields=filter`,
			RequestType.GET
		);
	});

	describe('addRoomAttachments', () => {
		test('addRoomAttachment is called correctly', async () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscMaxAttachmentSize: '100' }));
			// Send addRoomAttachments request
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			const area = '0x0';
			await roomsApi.addRoomAttachment(roomId, testFile, { area }, signal);

			expect(mockUploadFileFetchAPI).toHaveBeenCalledWith(
				`rooms/${roomId}/attachments`,
				RequestType.POST,
				testFile,
				signal,
				{ area, messageId: expect.stringMatching(UUID_REGEX) }
			);
		});

		test('addRoomAttachment is called correctly with optionalParams', async () => {
			mockUploadFileFetchAPI.mockImplementation(() => Promise.resolve());
			// Send addRoomAttachments request
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			const area = '0x0';
			await roomsApi.addRoomAttachment(
				roomId,
				testFile,
				{ description: 'description', replyId: 'stanzaId', area },
				signal
			);

			expect(mockUploadFileFetchAPI).toHaveBeenCalledWith(
				`rooms/${roomId}/attachments`,
				RequestType.POST,
				testFile,
				signal,
				{
					description: 'description',
					replyId: 'stanzaId',
					area,
					messageId: expect.stringMatching(UUID_REGEX)
				}
			);
		});

		test('addRoomAttachment is called correctly with placeholderRoom', async () => {
			mockFetchAPI.mockResolvedValueOnce(createMockRoom({ id: 'room0' }));
			mockFetchAPI.mockResolvedValueOnce(createMockMeeting({ id: 'meeting0' }));
			// Send addRoomAttachments request
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			const area = '0x0';
			await roomsApi.addRoomAttachment('placeholder-userId', testFile, { area }, signal);

			expect(mockFetchAPI).toHaveBeenNthCalledWith(1, 'rooms', RequestType.POST, {
				type: RoomType.ONE_TO_ONE,
				members: [{ userId: 'userId', owner: true }]
			});
		});

		test('addRoomAttachment(1.6.1) is called correctly', async () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscMaxAttachmentSize: '100' }));
			store.setApiVersion('1.6.1');
			mockSendFileFetchAPI.mockImplementation(() => Promise.resolve());
			// Send addRoomAttachments request
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			const area = '0x0';
			await roomsApi.addRoomAttachment(roomId, testFile, { area }, signal);

			expect(mockSendFileFetchAPI).toHaveBeenCalledWith(
				`rooms/${roomId}/attachments`,
				RequestType.PUT,
				testFile,
				signal,
				{ area, messageId: expect.stringMatching(UUID_REGEX) }
			);
		});

		test('addRoomAttachment(1.6.1) is called correctly with optionalParams', async () => {
			useStore.getState().setApiVersion('1.6.1');
			mockSendFileFetchAPI.mockImplementation(() => Promise.resolve());
			// Send addRoomAttachments request
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			const area = '0x0';
			await roomsApi.addRoomAttachment(
				roomId,
				testFile,
				{ description: 'description', replyId: 'stanzaId', area },
				signal
			);

			expect(mockSendFileFetchAPI).toHaveBeenCalledWith(
				`rooms/${roomId}/attachments`,
				RequestType.PUT,
				testFile,
				signal,
				{
					description: 'description',
					replyId: 'stanzaId',
					area,
					messageId: expect.stringMatching(UUID_REGEX)
				}
			);
		});
	});

	test('forwardMessages is called correctly', async () => {
		vi.spyOn(
			useStore.getState().connections.xmppClient,
			'requestMessageToForward'
		).mockImplementation(() => Promise.resolve());

		const message = createMockTextMessage();
		const xmlMessage = buildTextMessageFromHistory({
			roomId: message.roomId,
			from: message.from,
			text: message.text
		});
		const insideMessage = xmlMessage.getElementsByTagName('message')[0];
		vi.spyOn(HistoryAccumulator, 'getForwardedMessage').mockImplementationOnce(() => insideMessage);

		await roomsApi.forwardMessages(['roomId'], [message]);
		expect(mockFetchAPI).toHaveBeenCalledWith('rooms/roomId/forward', RequestType.POST, [
			{
				originalMessage: insideMessage.outerHTML,
				originalMessageSentAt: dateToISODate(message.date)
			}
		]);
	});

	test('forwardMessages - edited message - is called correctly', async () => {
		vi.spyOn(
			useStore.getState().connections.xmppClient,
			'requestMessageToForward'
		).mockImplementation(() => Promise.resolve());

		const message = createMockTextMessage({ text: 'edited' });
		const xmlMessage = buildTextMessageFromHistory({
			roomId: message.roomId,
			from: message.from,
			text: 'originalMessage'
		});
		const insideMessage = xmlMessage.getElementsByTagName('message')[0];
		vi.spyOn(HistoryAccumulator, 'getForwardedMessage').mockImplementationOnce(() => insideMessage);

		await roomsApi.forwardMessages(['roomId'], [message]);
		expect(mockFetchAPI).toHaveBeenCalledWith('rooms/roomId/forward', RequestType.POST, [
			{
				originalMessage: expect.stringContaining(message.text),
				originalMessageSentAt: dateToISODate(message.date)
			}
		]);
	});

	test('replacePlaceholderRoom is called correctly', async () => {
		// Send replacePlaceholderRoom request
		const room = createMockRoom({ id: 'room0' });
		const testFile = new File([], 'file.pdf', { type: applicationPdf });
		mockFetchAPI.mockResolvedValueOnce(room);
		await roomsApi.replacePlaceholderRoom('userId', 'text', testFile);

		expect(mockFetchAPI).toHaveBeenNthCalledWith(1, 'rooms', RequestType.POST, {
			type: RoomType.ONE_TO_ONE,
			members: [{ userId: 'userId', owner: true }]
		});
	});
});
