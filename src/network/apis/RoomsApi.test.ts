/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	addRoom,
	addRoomAttachment,
	addRoomMembers,
	clearRoomHistory,
	deleteRoom,
	deleteRoomAndMeeting,
	deleteRoomMember,
	deleteRoomPicture,
	demotesRoomMember,
	getRoom,
	bulkDeleteRoomAttachments,
	getRoomAttachments,
	getRoomMembers,
	getRoomPicture,
	getURLRoomPicture,
	listRooms,
	muteRoomNotification,
	promoteRoomMember,
	replacePlaceholderRoom,
	unmuteRoomNotification,
	updateRoom,
	updateRoomPicture
} from './RoomsApi';
import { QUOTA_CHANGED_EVENT } from '../../constants/appConstants';
import useStore from '../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockRoom
} from '../../tests/createMock';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { RoomType } from '../../types/store/RoomTypes';
import {
	mockFetchAPI,
	mockSendFileFetchAPI,
	mockUploadFileFetchAPI
} from '../../utils/__mocks__/FetchUtils';
import { RequestType } from '../../utils/FetchUtils';

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
		await listRooms();

		expect(mockFetchAPI).toHaveBeenCalledWith('rooms', RequestType.GET);
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

		await addRoom(roomToAdd);

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
		await getRoom(room.id);

		expect(mockFetchAPI).toHaveBeenCalledWith('rooms/room0', RequestType.GET);
	});

	test('updateRoom is called correctly', async () => {
		// Send updateRoom request
		const room = createMockRoom({ id: 'room0', name: 'new name' });
		mockFetchAPI.mockResolvedValueOnce(room);
		await updateRoom(room.id, { name: 'new name' });

		expect(mockFetchAPI).toHaveBeenCalledWith('rooms/room0', RequestType.PUT, { name: 'new name' });
	});

	test('deleteRoom is called correctly', async () => {
		const room = createMockRoom();
		// Send deleteRoom request
		await deleteRoom(room.id);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${room.id}`, RequestType.DELETE);
	});

	test('deleteRoomAndMeeting without an associated meeting is called correctly', async () => {
		const room = createMockRoom();
		// Send deleteRoom request
		await deleteRoomAndMeeting(room.id);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${room.id}`, RequestType.DELETE);
	});

	test('deleteRoomAndMeeting with an associated meeting is called correctly', async () => {
		const room = createMockRoom();
		const meeting = createMockMeeting({ roomId: room.id });
		useStore.getState().addMeetings([meeting]);
		// Send deleteRoom request
		await deleteRoomAndMeeting(room.id);

		expect(mockFetchAPI).toHaveBeenNthCalledWith(1, `meetings/${meeting.id}`, RequestType.DELETE);
		expect(mockFetchAPI).toHaveBeenNthCalledWith(2, `rooms/${room.id}`, RequestType.DELETE);
	});

	test('getURLRoomPicture is called correctly', () => {
		const room = createMockRoom({ id: roomId, name: 'new name' });
		const url = getURLRoomPicture(room.id);

		expect(url).toEqual(`http://localhost/services/chats/rooms/${roomId}/picture`);
	});

	test('getRoomPicture is called correctly', async () => {
		// Send getUserPicture request
		await getRoomPicture('roomId');

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/roomId/picture`, RequestType.GET);
	});

	test('updateRoomPicture is called correctly', async () => {
		mockUploadFileFetchAPI.mockResolvedValue(true);
		// Send updateRoomPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		await updateRoomPicture(roomId, testFile);

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

		await expect(updateRoomPicture(roomId, testFile)).rejects.toThrowError('File too large');
		expect(mockFetchAPI).not.toHaveBeenCalled();
	});

	test('deleteRoomPicture is called correctly', async () => {
		// Send deleteRoomPicture request
		await deleteRoomPicture(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/picture`, RequestType.DELETE);
	});

	test('muteRoomNotification is called correctly', async () => {
		// Send muteRoomNotification request
		await muteRoomNotification(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/mute`, RequestType.PUT);
	});

	test('unmuteRoomNotification is called correctly', async () => {
		// Send unmuteRoomNotification request
		await unmuteRoomNotification(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/mute`, RequestType.DELETE);
	});

	test('clearRoomHistory is called correctly', async () => {
		// Send clearRoomHistory request
		await clearRoomHistory(roomId);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/clear`, RequestType.PUT);
	});

	test('getRoomMembers is called correctly', async () => {
		// Send getRoomMembers request
		await getRoomMembers(roomId);

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
		await addRoomMembers(roomId, member);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/members`, RequestType.POST, member);
	});

	test('deleteRoomMember is called correctly', async () => {
		// Send deleteRoomMember request
		await deleteRoomMember(roomId, 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/${roomId}/members/userId`, RequestType.DELETE);
	});

	test('promoteRoomMember is called correctly', async () => {
		// Send promoteRoomMember request
		await promoteRoomMember(roomId, 'userId');

		expect(mockFetchAPI).toHaveBeenCalledWith(
			`rooms/${roomId}/members/userId/owner`,
			RequestType.PUT
		);
	});

	test('demotesRoomMember is called correctly', async () => {
		// Send demotesRoomMember request
		await demotesRoomMember('roomId', 'userId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			`rooms/roomId/members/userId/owner`,
			RequestType.DELETE
		);
	});

	test('getRoomAttachments is called correctly with the minimum required params', async () => {
		await getRoomAttachments('roomId', { limit: 20 });

		expect(mockFetchAPI).toHaveBeenCalledWith(`rooms/roomId/attachments?limit=20`, RequestType.GET);
	});

	test('getRoomAttachments forwards the cursor on subsequent pages', async () => {
		await getRoomAttachments('roomId', { limit: 20, cursor: 'token_1' });

		expect(mockFetchAPI).toHaveBeenCalledWith(
			`rooms/roomId/attachments?limit=20&cursor=token_1`,
			RequestType.GET
		);
	});

	test('getRoomAttachments serializes every supported filter and sort param', async () => {
		await getRoomAttachments('roomId', {
			limit: 20,
			userId: 'user-1',
			mimeType: 'image/png',
			createdAfter: '2024-01-01T00:00:00Z',
			createdBefore: '2024-12-31T23:59:59Z',
			minSize: 1024,
			maxSize: 1048576,
			sortBy: 'created_at',
			order: 'desc'
		});

		expect(mockFetchAPI).toHaveBeenCalledWith(
			`rooms/roomId/attachments?limit=20&userId=user-1&mimeType=image%2Fpng&createdAfter=2024-01-01T00%3A00%3A00Z&createdBefore=2024-12-31T23%3A59%3A59Z&minSize=1024&maxSize=1048576&sortBy=created_at&order=desc`,
			RequestType.GET
		);
	});

	test('bulkDeleteRoomAttachments sends attachmentIds array', async () => {
		await bulkDeleteRoomAttachments('roomId', ['att1', 'att2']);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			`rooms/roomId/attachments`,
			RequestType.DELETE,
			{ attachmentIds: ['att1', 'att2'] }
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
			await addRoomAttachment(roomId, testFile, { area }, signal);

			expect(mockUploadFileFetchAPI).toHaveBeenCalledWith(
				`rooms/${roomId}/attachments`,
				RequestType.POST,
				testFile,
				signal,
				{ area, tempId: expect.stringMatching(UUID_REGEX) }
			);
		});

		test('addRoomAttachment is called correctly with optionalParams', async () => {
			mockUploadFileFetchAPI.mockImplementation(() => Promise.resolve());
			// Send addRoomAttachments request
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			const area = '0x0';
			await addRoomAttachment(
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
					tempId: expect.stringMatching(UUID_REGEX)
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
			await addRoomAttachment('placeholder-userId', testFile, { area }, signal);

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
			await addRoomAttachment(roomId, testFile, { area }, signal);

			expect(mockSendFileFetchAPI).toHaveBeenCalledWith(
				`rooms/${roomId}/attachments`,
				RequestType.PUT,
				testFile,
				signal,
				{ area, tempId: expect.stringMatching(UUID_REGEX) }
			);
		});

		test('addRoomAttachment(1.6.1) is called correctly with optionalParams', async () => {
			useStore.getState().setApiVersion('1.6.1');
			mockSendFileFetchAPI.mockImplementation(() => Promise.resolve());
			// Send addRoomAttachments request
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			const area = '0x0';
			await addRoomAttachment(
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
					tempId: expect.stringMatching(UUID_REGEX)
				}
			);
		});
	});

	describe('addRoomAttachment dispatches quota changed event', () => {
		test('dispatches event on successful upload (legacy path)', async () => {
			const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscMaxAttachmentSize: '100' }));
			mockUploadFileFetchAPI.mockResolvedValueOnce({ id: 'fileId' });
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			await addRoomAttachment(roomId, testFile, { area: '0x0' }, signal);
			expect(dispatchSpy).toHaveBeenCalledWith(
				expect.objectContaining({ type: QUOTA_CHANGED_EVENT })
			);
			dispatchSpy.mockRestore();
		});

		test('dispatches event on successful upload (1.6.1+ path)', async () => {
			const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscMaxAttachmentSize: '100' }));
			store.setApiVersion('1.6.1');
			mockSendFileFetchAPI.mockResolvedValueOnce({ id: 'fileId' });
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			await addRoomAttachment(roomId, testFile, { area: '0x0' }, signal);
			expect(dispatchSpy).toHaveBeenCalledWith(
				expect.objectContaining({ type: QUOTA_CHANGED_EVENT })
			);
			dispatchSpy.mockRestore();
		});

		test('does not dispatch event on upload failure', async () => {
			const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscMaxAttachmentSize: '100' }));
			mockUploadFileFetchAPI.mockRejectedValueOnce(new Error('upload failed'));
			const testFile = new File([], 'file.pdf', { type: applicationPdf });
			const { signal } = new AbortController();
			await expect(addRoomAttachment(roomId, testFile, { area: '0x0' }, signal)).rejects.toThrow();
			expect(dispatchSpy).not.toHaveBeenCalledWith(
				expect.objectContaining({ type: QUOTA_CHANGED_EVENT })
			);
			dispatchSpy.mockRestore();
		});
	});

	test('replacePlaceholderRoom is called correctly', async () => {
		// Send replacePlaceholderRoom request
		const room = createMockRoom({ id: 'room0' });
		mockFetchAPI.mockResolvedValueOnce(room);
		await replacePlaceholderRoom('userId');

		expect(mockFetchAPI).toHaveBeenNthCalledWith(1, 'rooms', RequestType.POST, {
			type: RoomType.ONE_TO_ONE,
			members: [{ userId: 'userId', owner: true }]
		});
	});
});
