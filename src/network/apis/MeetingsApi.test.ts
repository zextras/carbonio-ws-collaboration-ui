/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import meetingsApi from './MeetingsApi';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { fetchResponse } from '../../tests/mocks/global';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { User, UserType } from '../../types/store/UserTypes';

const meetingMock = createMockMeeting();
const meetingNotActiveMock = createMockMeeting({ active: false });
const scheduledMeetingMock = createMockMeeting({ meetingType: MeetingType.SCHEDULED });
const meetingMock1 = createMockMeeting({ id: 'meetingId1', roomId: 'roomId1' });
const roomMock = createMockRoom({ meetingId: meetingMock.id });
const roomWithoutMeetingMock = createMockRoom();
const guestUser: User = createMockUser({ type: UserType.GUEST });

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
	useStore.getState().addRoom(roomMock);
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

	test('joinMeeting is called correctly for a permanent meeting', async () => {
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

		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}`, {
			method: 'GET',
			headers
		});

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting[meetingMock.id]).toBeDefined();
	});

	test('joinMeeting is called correctly for a scheduled meeting', async () => {
		fetchResponse.mockResolvedValueOnce({ status: 'ACCEPTED' });
		fetchResponse.mockResolvedValueOnce(scheduledMeetingMock);
		await meetingsApi.joinMeeting(
			meetingMock.id,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);
		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${scheduledMeetingMock.id}/join`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					audioStreamEnabled: false,
					videoStreamEnabled: false
				})
			}
		);

		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${scheduledMeetingMock.id}`,
			{
				method: 'GET',
				headers
			}
		);

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting[scheduledMeetingMock.id]).toBeDefined();
	});

	test('enterMeeting is called correctly when a meeting is already present and active', async () => {
		useStore.getState().addMeeting(meetingMock);
		await meetingsApi.enterMeeting(
			meetingMock.roomId,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);

		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings/${meetingMock.id}/join`, {
			method: RequestType.POST,
			headers,
			body: JSON.stringify({
				audioStreamEnabled: false,
				videoStreamEnabled: false
			})
		});
	});

	test('enterMeeting is called correctly when a meeting is already present but not active', async () => {
		useStore.getState().addMeeting(meetingNotActiveMock);
		await meetingsApi.enterMeeting(
			meetingNotActiveMock.roomId,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);

		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingNotActiveMock.id}/start`,
			{
				method: RequestType.POST,
				headers
			}
		);

		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingNotActiveMock.id}/join`,
			{
				method: RequestType.POST,
				headers,
				body: JSON.stringify({
					audioStreamEnabled: false,
					videoStreamEnabled: false
				})
			}
		);
	});

	test('enterMeeting is called correctly when the meeting instance is not yet created', async () => {
		useStore.getState().addRoom(roomWithoutMeetingMock);
		fetchResponse.mockResolvedValueOnce(scheduledMeetingMock);

		await meetingsApi.enterMeeting(
			roomWithoutMeetingMock.id,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);

		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/meetings`, {
			method: RequestType.POST,
			headers,
			body: JSON.stringify({
				roomId: roomWithoutMeetingMock.id,
				meetingType: MeetingType.PERMANENT,
				name: roomWithoutMeetingMock.name
			})
		});

		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${scheduledMeetingMock.id}/start`,
			{
				method: RequestType.POST,
				headers
			}
		);

		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${scheduledMeetingMock.id}/join`,
			{
				method: RequestType.POST,
				headers,
				body: JSON.stringify({
					audioStreamEnabled: false,
					videoStreamEnabled: false
				})
			}
		);
	});

	test('leaveMeeting for external user is called correctly', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		fetchResponse.mockResolvedValueOnce(meetingMock);
		useStore.getState().setLoginInfo(guestUser.id, guestUser.name, guestUser.name, guestUser.type);
		await meetingsApi.leaveMeeting(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/leave`,
			expect.objectContaining({
				method: 'POST',
				headers,
				body: undefined
			})
		);

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting[meetingMock.id]).not.toBeDefined();
		expect(document.cookie).toBe('');
	});

	test('leaveMeeting for internal user is called correctly', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
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
		expect(document.cookie).toBe('ZM_AUTH_TOKEN=123456789; ZX_AUTH_TOKEN=123456789');
	});

	test('leaveMeeting for internal user is rejected', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		fetchResponse.mockRejectedValueOnce(false);
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
		expect(document.cookie).toBe('ZM_AUTH_TOKEN=123456789; ZX_AUTH_TOKEN=123456789');
	});

	test('leaveMeeting for external user is rejected', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		useStore.getState().setLoginInfo(guestUser.id, guestUser.name, guestUser.name, guestUser.type);

		fetchResponse.mockRejectedValueOnce(false);
		await meetingsApi.leaveMeeting(meetingMock.id);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/leave`,
			expect.objectContaining({
				method: 'POST',
				headers,
				body: undefined
			})
		);

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting[meetingMock.id]).not.toBeDefined();
		expect(document.cookie).toBe('');
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

	test('leaveWaitingRoom is called correctly for internal user', async () => {
		const cookie = `ZM_AUTH_TOKEN=123456789`;
		document.cookie = cookie;
		fetchResponse.mockResolvedValueOnce({});
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
		expect(document.cookie).toBe(cookie);
	});

	test('leaveWaitingRoom is called correctly for guest user', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789`;
		useStore.getState().setLoginInfo(userId, guestUser.email, guestUser.name, guestUser.type);
		useStore.getState().setSessionId('queueId');
		fetchResponse.mockResolvedValueOnce({});
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
		expect(document.cookie).toBe('');
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

	test('createMediaAnswer is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({});
		await meetingsApi.createMediaAnswer(meetingMock.id, 'sdpAnswer');

		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/media/answer`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					sdp: 'sdpAnswer'
				})
			}
		);
	});

	test('createAudioOffer is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({});
		await meetingsApi.createAudioOffer(meetingMock.id, 'sdpOffer');

		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/meetings/${meetingMock.id}/audio/offer`,
			{
				method: 'PUT',
				headers,
				body: JSON.stringify({
					sdp: 'sdpOffer'
				})
			}
		);
	});

	test('getScheduledMeetingName is called correctly', async () => {
		fetchResponse.mockResolvedValueOnce({});
		await meetingsApi.getScheduledMeetingName(meetingMock.id);

		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/public/meetings/${meetingMock.id}`, {
			method: 'GET',
			headers
		});
	});

	test('authLogin is called correctly', async () => {
		await meetingsApi.authLogin();

		expect(global.fetch).toHaveBeenCalledWith(`/zx/login/v3/config`, {
			method: 'GET'
		});
	});

	test('createGuestAccount is called correctly', async () => {
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		await meetingsApi.createGuestAccount('userName');

		expect(global.fetch).toHaveBeenCalledWith(`/zx/auth/v3/guests?name=userName`, {
			method: 'POST',
			headers
		});
	});
});
