/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import meetingsApi from './MeetingsApi';
import useStore from '../../store/Store';
import { createMockMeeting, createMockMember, createMockRoom } from '../../tests/createMock';
import { fetchResponse } from '../../tests/mocks/global';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';

const meetingMock = createMockMeeting();
const meetingMock1 = createMockMeeting({ id: 'meetingId1', roomId: 'roomId1' });

const userId = 'userId';

// Set appropriate headers for meeting requests
const headers = new Headers();
headers.append('Content-Type', 'application/json');
headers.append('queue-id', 'queueId');

const ongoingMeetingSetup = (): void => {
	const store = useStore.getState();
	store.addMeeting(meetingMock);
	store.addParticipant(meetingMock.id, {
		userId: 'userId',
		audioStreamOn: false,
		videoStreamOn: false,
		joinedAt: '2021-01-01T00:00:00.000Z'
	});
};

const sdpOffer = 'spdOfferMock';

beforeEach(() => {
	useStore.getState().setLoginInfo(userId, 'User');
	useStore.getState().setSessionId('queueId');
});
describe('Meetings API', () => {
	test('listMeetings is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce([meetingMock, meetingMock1]);
		await meetingsApi.listMeetings();

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings`, {
			method: 'GET',
			headers,
			body: undefined
		});

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(size(store.meetings)).toEqual(2);
		expect(store.meetings[meetingMock.roomId].id).toEqual(meetingMock.id);
		expect(store.meetings[meetingMock.roomId].id).toEqual(meetingMock.id);
		expect(size(store.meetings[meetingMock.roomId].participants)).toEqual(
			size(meetingMock.participants)
		);
	});

	test('createMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.createMeeting('roomId', MeetingType.PERMANENT, '');
		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				roomId: 'roomId',
				meetingType: MeetingType.PERMANENT,
				name: ''
			})
		});
	});

	test('getMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.getMeeting(meetingMock.roomId);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/rooms/${meetingMock.roomId}/meeting`,
			{
				method: 'GET',
				headers,
				body: undefined
			}
		);
	});

	test('getMeetingById is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.getMeetingByMeetingId(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}`, {
			method: 'GET',
			headers,
			body: undefined
		});
	});

	test('start is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.startMeeting('meetingId');
		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/start`, {
			method: 'POST',
			headers
		});
	});

	test('joinMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({ status: 'ACCEPTED' });
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.joinMeeting(
			meetingMock.id,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);
		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/join`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				audioStreamEnabled: false,
				videoStreamEnabled: false
			})
		});

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting[meetingMock.id]).toBeDefined();
	});

	test('leaveMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.leaveMeeting(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/leave`, {
			method: 'POST',
			headers,
			body: undefined
		});

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting[meetingMock.id]).not.toBeDefined();
	});

	test('When a member leaves a scheduled meeting, he is also removed from temporary room', async () => {
		const temporaryRoom = createMockRoom({
			meetingId: meetingMock.id,
			type: RoomType.TEMPORARY,
			members: [createMockMember({ userId })]
		});
		const store = useStore.getState();
		store.addRoom(temporaryRoom);

		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.leaveMeeting(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toBeCalledTimes(2);

		// Check if store is correctly updated
		const updatedStore = useStore.getState();
		expect(updatedStore.rooms[meetingMock.roomId]).not.toBeDefined();
	});

	test("When an owner leaves a scheduled meeting, he isn't removed from temporary room", async () => {
		const temporaryRoom = createMockRoom({
			meetingId: meetingMock.id,
			type: RoomType.TEMPORARY,
			members: [createMockMember({ userId, owner: true })]
		});
		const store = useStore.getState();
		store.addRoom(temporaryRoom);

		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.leaveMeeting(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toBeCalledTimes(1);

		// Check if store is correctly updated
		const updatedStore = useStore.getState();
		expect(updatedStore.rooms[temporaryRoom.id]).toBeDefined();
	});

	test('stopMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.stopMeeting('meetingId');
		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/stop`, {
			method: 'POST',
			headers
		});
	});

	test('deleteMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.deleteMeeting(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}`, {
			method: 'DELETE',
			headers,
			body: undefined
		});
	});

	test('updateAudioStreamStatus is called to set audio enabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateAudioStreamStatus(meetingMock.id, true);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/audio`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				enabled: true
			})
		});
	});

	test('updateAudioStreamStatus is called to set audio disabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateAudioStreamStatus(meetingMock.id, false);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/audio`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				enabled: false
			})
		});
	});

	test('updateVideoStreamStatus is called to set video enabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.VIDEO, true, sdpOffer);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/media`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				type: STREAM_TYPE.VIDEO,
				enabled: true,
				sdp: sdpOffer
			})
		});
	});

	test('updateVideoStreamStatus is called to set video disabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.VIDEO, false);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/media`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				type: STREAM_TYPE.VIDEO,
				enabled: false
			})
		});
	});

	test('updateScreenStreamStatus is called to set screen share enabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.SCREEN, true, sdpOffer);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/media`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				type: STREAM_TYPE.SCREEN,
				enabled: true,
				sdp: sdpOffer
			})
		});
	});

	test('updateScreenStreamStatus is called to set screen share disabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.SCREEN, false);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/media`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				type: STREAM_TYPE.SCREEN,
				enabled: false
			})
		});
	});

	test('leaveWaitingRoom is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({ status: 'ACCEPTED' });
		await meetingsApi.leaveWaitingRoom(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/queue/${userId}`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					status: 'REJECTED'
				})
			}
		);
	});

	test('getWaitingList is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({ users: [userId] });
		await meetingsApi.getWaitingList(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/queue`, {
			method: 'GET',
			headers,
			body: undefined
		});
	});

	test('acceptWaitingUser is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({ status: 'ACCEPTED' });
		await meetingsApi.acceptWaitingUser(meetingMock.id, userId, true);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/queue/${userId}`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					status: 'ACCEPTED'
				})
			}
		);
	});

	test('startRecording is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({});
		await meetingsApi.startRecording(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/startRecording`,
			{
				method: 'POST',
				headers,
				body: undefined
			}
		);
	});

	test('stopRecording is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({});
		await meetingsApi.stopRecording(meetingMock.id, 'recordingName', 'folderId');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/stopRecording`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					name: 'recordingName',
					folderId: 'folderId'
				})
			}
		);
	});
});
