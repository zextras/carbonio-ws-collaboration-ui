/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import roomsApi from './RoomsApi';
import useStore from '../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import { spyOnFetch } from '../../tests/jest-env-setup';
import { mockedUuid } from '../../tests/mocks/global';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { dateToISODate } from '../../utils/dateUtils';
import * as FetchUtils from '../../utils/FetchUtils';
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
		spyOnFetch.mockResolvedValueOnce([room]);
		await roomsApi.listRooms(true, true);

		expect(spyOnFetch).toHaveBeenCalledWith(
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

		expect(spyOnFetch).toHaveBeenCalledWith('rooms', RequestType.POST, roomToAdd);
		expect(spyOnFetch).toHaveBeenLastCalledWith('meetings', RequestType.POST, {
			meetingType: MeetingType.PERMANENT,
			name: ''
		});
	});

	test('getRoom is called correctly', async () => {
		// Send getRoom request
		const room = createMockRoom({ id: 'room0' });
		spyOnFetch.mockResolvedValueOnce(room);
		await roomsApi.getRoom(room.id);

		expect(spyOnFetch).toHaveBeenCalledWith('rooms/room0', RequestType.GET);
	});

	test('updateRoom is called correctly', async () => {
		// Send updateRoom request
		const room = createMockRoom({ id: 'room0', name: 'new name' });
		spyOnFetch.mockResolvedValueOnce(room);
		await roomsApi.updateRoom(room.id, { name: 'new name' });

		expect(spyOnFetch).toHaveBeenCalledWith('rooms/room0', RequestType.PUT, { name: 'new name' });
	});

	test('deleteRoom is called correctly', async () => {
		const room = createMockRoom();
		// Send deleteRoom request
		await roomsApi.deleteRoom(room.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/${room.id}`, RequestType.DELETE);
	});

	test('deleteRoomAndMeeting without an associated meeting is called correctly', async () => {
		const room = createMockRoom();
		// Send deleteRoom request
		await roomsApi.deleteRoomAndMeeting(room.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/${room.id}`, RequestType.DELETE);
	});

	test('deleteRoomAndMeeting with an associated meeting is called correctly', async () => {
		const room = createMockRoom();
		const meeting = createMockMeeting({ roomId: room.id });
		useStore.getState().addMeeting(meeting);
		// Send deleteRoom request
		await roomsApi.deleteRoomAndMeeting(room.id);

		expect(spyOnFetch).toHaveBeenNthCalledWith(1, `meetings/${meeting.id}`, RequestType.DELETE);
		expect(spyOnFetch).toHaveBeenNthCalledWith(2, `rooms/${room.id}`, RequestType.DELETE);
	});

	test('getURLRoomPicture is called correctly', () => {
		const room = createMockRoom({ id: 'roomId', name: 'new name' });
		const url = roomsApi.getURLRoomPicture(room.id);

		expect(url).toEqual(`http://localhost/services/chats/rooms/roomId/picture`);
	});

	test('getRoomPicture is called correctly', async () => {
		// Send getUserPicture request
		await roomsApi.getRoomPicture('roomId');

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/picture`, RequestType.GET);
	});

	test('updateRoomPicture is called correctly', async () => {
		const spyOnUploadFileFetchAPI = jest
			.spyOn(FetchUtils, 'uploadFileFetchAPI')
			.mockResolvedValue(true);
		// Send updateRoomPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		await roomsApi.updateRoomPicture('roomId', testFile);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('fileName', '\\u0069\\u006d\\u0061\\u0067\\u0065\\u002e\\u0070\\u006e\\u0067'); // Unicode of 'image.png'
		headers.append('mimeType', testFile.type);

		expect(spyOnUploadFileFetchAPI).toHaveBeenCalledWith(
			'rooms/roomId/picture',
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

		expect(roomsApi.updateRoomPicture('roomId', testFile)).rejects.toThrowError('File too large');
		expect(spyOnFetch).not.toHaveBeenCalled();
	});

	test('deleteRoomPicture is called correctly', async () => {
		// Send deleteRoomPicture request
		await roomsApi.deleteRoomPicture('roomId');

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/picture`, RequestType.DELETE);
	});

	test('muteRoomNotification is called correctly', async () => {
		// Send muteRoomNotification request
		await roomsApi.muteRoomNotification('roomId');

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/mute`, RequestType.PUT);
	});

	test('unmuteRoomNotification is called correctly', async () => {
		// Send unmuteRoomNotification request
		await roomsApi.unmuteRoomNotification('roomId');

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/mute`, RequestType.DELETE);
	});

	test('clearRoomHistory is called correctly', async () => {
		// Send clearRoomHistory request
		await roomsApi.clearRoomHistory('roomId');

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/clear`, RequestType.PUT);
	});

	test('getRoomMembers is called correctly', async () => {
		// Send getRoomMembers request
		await roomsApi.getRoomMembers('roomId');

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/members`, RequestType.GET);
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
		await roomsApi.addRoomMembers('roomId', member);

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/members`, RequestType.POST, member);
	});

	test('deleteRoomMember is called correctly', async () => {
		// Send deleteRoomMember request
		await roomsApi.deleteRoomMember('roomId', 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/members/userId`, RequestType.DELETE);
	});

	test('promoteRoomMember is called correctly', async () => {
		// Send promoteRoomMember request
		await roomsApi.promoteRoomMember('roomId', 'userId');

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/members/userId/owner`, RequestType.PUT);
	});

	test('demotesRoomMember is called correctly', async () => {
		// Send demotesRoomMember request
		await roomsApi.demotesRoomMember('roomId', 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`rooms/roomId/members/userId/owner`,
			RequestType.DELETE
		);
	});

	test('getRoomAttachments is called correctly', async () => {
		// Send getRoomAttachments request
		await roomsApi.getRoomAttachments('roomId');

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/roomId/attachments`, RequestType.GET);
	});

	test('getRoomAttachments is called correctly with params', async () => {
		// Send getRoomAttachments request
		await roomsApi.getRoomAttachments('roomId', 3, 'filter');

		expect(spyOnFetch).toHaveBeenCalledWith(
			`rooms/roomId/attachments?itemsNumber=3&extraFields=filter`,
			RequestType.GET
		);
	});

	test('addRoomAttachment is called correctly', async () => {
		const store = useStore.getState();
		store.setAttributes(createMockAttributesList({ carbonioWscMaxAttachmentSize: '100' }));
		const spyOnUploadFileFetchAPI = jest
			.spyOn(FetchUtils, 'uploadFileFetchAPI')
			.mockImplementation(() => Promise.resolve());
		// Send addRoomAttachments request
		const testFile = new File([], 'file.pdf', { type: applicationPdf });
		const { signal } = new AbortController();
		const area = '0x0';
		await roomsApi.addRoomAttachment('roomId', testFile, { area }, signal);

		expect(spyOnUploadFileFetchAPI).toHaveBeenCalledWith(
			'rooms/roomId/attachments',
			RequestType.POST,
			testFile,
			signal,
			{ area, messageId: mockedUuid }
		);
	});

	test('addRoomAttachment is called correctly with optionalParams', async () => {
		const spyOnUploadFileFetchAPI = jest
			.spyOn(FetchUtils, 'uploadFileFetchAPI')
			.mockImplementation(() => Promise.resolve());
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

		expect(spyOnUploadFileFetchAPI).toHaveBeenCalledWith(
			'rooms/roomId/attachments',
			RequestType.POST,
			testFile,
			signal,
			{ description: 'description', replyId: 'stanzaId', area, messageId: mockedUuid }
		);
	});

	test('addRoomAttachment is called correctly with placeholderRoom', async () => {
		spyOnFetch.mockResolvedValueOnce(createMockRoom({ id: 'room0' }));
		spyOnFetch.mockResolvedValueOnce(createMockMeeting({ id: 'meeting0' }));
		// Send addRoomAttachments request
		const testFile = new File([], 'file.pdf', { type: applicationPdf });
		const { signal } = new AbortController();
		const area = '0x0';
		await roomsApi.addRoomAttachment('placeholder-userId', testFile, { area }, signal);

		expect(spyOnFetch).toHaveBeenNthCalledWith(1, 'rooms', RequestType.POST, {
			type: RoomType.ONE_TO_ONE,
			members: [{ userId: 'userId', owner: true }]
		});
	});

	test('forwardMessages is called correctly', async () => {
		const spyOnRequestMessageToForward = jest.spyOn(
			useStore.getState().connections.xmppClient,
			'requestMessageToForward'
		);
		// Send addRoom request
		const message = createMockTextMessage();
		const forwardedMessage = {
			originalMessage: undefined,
			originalMessageSentAt: dateToISODate(message.date)
		};
		spyOnRequestMessageToForward.mockImplementation(() => Promise.resolve(forwardedMessage as any));

		await roomsApi.forwardMessages(['roomId'], [message]);

		expect(spyOnFetch).toHaveBeenCalledWith('rooms/roomId/forward', RequestType.POST, [
			forwardedMessage
		]);
	});

	test('forwardMessages - edited message - is called correctly', async () => {
		const spyOnRequestMessageToForward = jest.spyOn(
			useStore.getState().connections.xmppClient,
			'requestMessageToForward'
		);
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

		spyOnRequestMessageToForward.mockImplementation(() => Promise.resolve(messageParsed!));

		await roomsApi.forwardMessages(['roomId'], [messageEdited]);

		expect(spyOnFetch).toHaveBeenCalledWith('rooms/roomId/forward', RequestType.POST, [
			forwardedMessage
		]);
	});

	test('replacePlaceholderRoom is called correctly', async () => {
		// Send replacePlaceholderRoom request
		const room = createMockRoom({ id: 'room0' });
		const testFile = new File([], 'file.pdf', { type: applicationPdf });
		spyOnFetch.mockResolvedValueOnce(room);
		await roomsApi.replacePlaceholderRoom('userId', 'text', testFile);

		expect(spyOnFetch).toHaveBeenNthCalledWith(1, 'rooms', RequestType.POST, {
			type: RoomType.ONE_TO_ONE,
			members: [{ userId: 'userId', owner: true }]
		});
	});
});
