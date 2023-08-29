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
import { MeetingType, MeetingUserType } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';

const meetingMock = createMockMeeting();
const meetingMock1 = createMockMeeting({ id: 'meetingId1', roomId: 'roomId1' });

const userId = 'userId';
const queueId = 'queueId';

// Set appropriate headers for meeting requests
const headers = new Headers();
headers.append('Content-Type', 'application/json');
headers.append('queue-id', 'queueId');

const ongoingMeetingSetup = (): void => {
	const store = useStore.getState();
	store.addMeeting(meetingMock);
	store.addParticipant(meetingMock.id, {
		userId: 'userId',
		userType: MeetingUserType.REGISTERED,
		audioStreamOn: false,
		videoStreamOn: false
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

	test('createPermanentMeeting is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.createPermanentMeeting('roomId');
		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				name: '',
				users: [],
				roomId: 'roomId',
				meetingType: MeetingType.PERMANENT
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
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.joinMeeting(meetingMock.id, {
			audioStreamEnabled: false,
			videoStreamEnabled: false
		});
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
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/${queueId}/audio`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					enabled: true
				})
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[userId];
		expect(participant.audioStreamOn).toEqual(true);
	});

	test('updateAudioStreamStatus is called to set audio disabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateAudioStreamStatus(meetingMock.id, false);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/${queueId}/audio`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					enabled: false
				})
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[userId];
		expect(participant.audioStreamOn).toEqual(false);
	});

	test('updateVideoStreamStatus is called to set video enabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.VIDEO, true, sdpOffer);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/${queueId}/media`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					type: STREAM_TYPE.VIDEO,
					enabled: true,
					sdp: sdpOffer
				})
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[userId];
		expect(participant.videoStreamOn).toEqual(true);
	});

	test('updateVideoStreamStatus is called to set video disabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.VIDEO, false);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/${queueId}/media`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					type: STREAM_TYPE.VIDEO,
					enabled: false
				})
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[userId];
		expect(participant.videoStreamOn).toEqual(false);
	});

	test('updateScreenStreamStatus is called to set screen share enabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.SCREEN, true, sdpOffer);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/${queueId}/media`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					type: STREAM_TYPE.SCREEN,
					enabled: true,
					sdp: sdpOffer
				})
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[userId];
		expect(participant.screenStreamOn).toEqual(true);
	});

	test('updateScreenStreamStatus is called to set screen share disabled', async () => {
		ongoingMeetingSetup();
		fetchResponse.mockResolvedValueOnce(meetingMock);
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.SCREEN, false);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/sessions/${queueId}/media`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					type: STREAM_TYPE.SCREEN,
					enabled: false
				})
			}
		);

		// Check if store is correctly updated
		const participant = useStore.getState().meetings[meetingMock.roomId].participants[userId];
		expect(participant.screenStreamOn).toEqual(false);
	});
});
