/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import meetingsApi from './MeetingsApi';
import { fetchResponse } from '../../../jest-mocks';
import useStore from '../../store/Store';
import { createMockMeeting } from '../../tests/createMock';

const meetingMock = createMockMeeting();
const meetingMock1 = createMockMeeting({ id: 'meetingId1', roomId: 'roomId1' });

const sessionId = 'sessionId';

// Set appropriate headers for meeting requests
const headers = new Headers();
headers.append('Content-Type', 'application/json');
headers.append('session-id', 'sessionId');

const ongoingMeetingSetup = (): void => {
	const store = useStore.getState();
	store.addMeeting(meetingMock);
	store.addParticipant(meetingMock.id, {
		userId: 'userId',
		sessionId,
		audioStreamOn: false,
		videoStreamOn: false
	});
};

beforeEach(() => {
	useStore.getState().setSessionId('sessionId');
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

	test('joinMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.joinMeeting(meetingMock.roomId, {
			audioStreamOn: false,
			videoStreamOn: false
		});

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/rooms/${meetingMock.roomId}/meeting/join`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					audioStreamOn: false,
					videoStreamOn: false
				})
			}
		);
	});

	test('joinMeetingByMeetingId is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.joinMeetingByMeetingId(meetingMock.id, {
			audioStreamOn: false,
			videoStreamOn: false
		});
		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/join`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				audioStreamOn: false,
				videoStreamOn: false
			})
		});
	});

	test('leaveMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.leaveMeeting(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/leave`, {
			method: 'PUT',
			headers,
			body: undefined
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

	test('openVideoStream is called correctly', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.openVideoStream(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/video`, {
			method: 'PUT',
			headers,
			body: undefined
		});

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[sessionId];
		expect(participant.hasVideoStreamOn).toEqual(true);
	});

	test('closeVideoStream is called correctly', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.closeVideoStream(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/sessionId/video`,
			{
				method: 'DELETE',
				headers,
				body: undefined
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[sessionId];
		expect(participant.hasVideoStreamOn).toEqual(false);
	});

	test('openAudioStream is called correctly', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.openAudioStream(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/audio`, {
			method: 'PUT',
			headers,
			body: undefined
		});

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[sessionId];
		expect(participant.hasAudioStreamOn).toEqual(true);
	});

	test('closeAudioStream is called correctly', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.closeAudioStream(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/sessionId/audio`,
			{
				method: 'DELETE',
				headers,
				body: undefined
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[sessionId];
		expect(participant.hasAudioStreamOn).toEqual(false);
	});

	test('openScreenShareStream is called correctly', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.openScreenShareStream(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/screen`, {
			method: 'PUT',
			headers,
			body: undefined
		});

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[sessionId];
		expect(participant.hasScreenStreamOn).toEqual(true);
	});

	test('closeScreenShareStream is called correctly', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.closeScreenShareStream(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/sessionId/screen`,
			{
				method: 'DELETE',
				headers,
				body: undefined
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[sessionId];
		expect(participant.hasScreenStreamOn).toEqual(false);
	});
});
