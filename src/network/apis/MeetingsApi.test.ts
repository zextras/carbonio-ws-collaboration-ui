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
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { spyOnFetch } from '../../tests/jest-env-setup';
import { MeetingsApiToSpy, spyOnMeetingsApi } from '../../tests/mocks/network';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { User, UserType } from '../../types/store/UserTypes';
import { dateToISODate } from '../../utils/dateUtils';

const meetingMock = createMockMeeting();
const meetingNotActiveMock = createMockMeeting({ active: false });
const scheduledMeetingMock = createMockMeeting({ meetingType: MeetingType.SCHEDULED });
const meetingMock1 = createMockMeeting({ id: 'meetingId1', roomId: 'roomId1' });
const roomMock = createMockRoom({ meetingId: meetingMock.id });
const roomWithoutMeetingMock = createMockRoom();
const guestUser: User = createMockUser({ type: UserType.GUEST });

const userId = 'userId';

const ongoingMeetingSetup = (): void => {
	const store = useStore.getState();
	store.addMeetings([meetingMock]);
	store.addParticipant(meetingMock.id, {
		userId: 'userId',
		audioStreamOn: false,
		videoStreamOn: false,
		joinedAt: '2021-01-01T00:00:00.000Z'
	});
};

const sdpOffer = 'spdOfferMock';

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(userId, 'User');
	store.setQueueId('queueId');
	store.addRooms([roomMock]);
});

describe('Meetings API', () => {
	test('listMeetings is called correctly', async () => {
		spyOnFetch.mockResolvedValueOnce([meetingMock, meetingMock1]);
		await meetingsApi.listMeetings();

		expect(spyOnFetch).toHaveBeenCalledWith('meetings', RequestType.GET);
		// Check if store is correctly updated
		const store = useStore.getState();
		expect(size(store.meetings)).toEqual(2);
		expect(store.meetings[meetingMock.id]).toBeDefined();
		expect(size(store.meetings[meetingMock.id].participants)).toEqual(
			size(meetingMock.participants)
		);
	});

	test('createMeeting is called correctly', async () => {
		await meetingsApi.createMeeting('roomId', MeetingType.PERMANENT, '');

		expect(spyOnFetch).toHaveBeenCalledWith('meetings', RequestType.POST, {
			expiration: undefined,
			meetingType: 'permanent',
			name: '',
			roomId: 'roomId'
		});
	});

	test('getMeeting is called correctly', async () => {
		await meetingsApi.getMeeting(meetingMock.roomId);

		expect(spyOnFetch).toHaveBeenCalledWith(`rooms/${meetingMock.roomId}/meeting`, RequestType.GET);
	});

	test('getMeetingById is called correctly', async () => {
		spyOnFetch.mockResolvedValueOnce(meetingMock);
		await meetingsApi.getMeetingByMeetingId(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}`, RequestType.GET);
	});

	test('start is called correctly', async () => {
		await meetingsApi.startMeeting('meetingId');

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/start`, RequestType.POST);
	});

	test('joinMeeting is called correctly for a permanent meeting', async () => {
		spyOnFetch.mockResolvedValueOnce({ status: 'ACCEPTED' });
		spyOnFetch.mockResolvedValueOnce(meetingMock);
		await meetingsApi.joinMeeting(
			meetingMock.id,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/join`, RequestType.POST, {
			audioStreamEnabled: false,
			videoStreamEnabled: false
		});

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}`, RequestType.GET);
		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting).toBeDefined();
	});

	test('joinMeeting is called correctly for a scheduled meeting', async () => {
		spyOnFetch.mockResolvedValueOnce({ status: 'ACCEPTED' });
		spyOnFetch.mockResolvedValueOnce(scheduledMeetingMock);
		await meetingsApi.joinMeeting(
			meetingMock.id,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${scheduledMeetingMock.id}/join`,
			RequestType.POST,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			}
		);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${scheduledMeetingMock.id}`, RequestType.GET);
		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting).toBeDefined();
	});

	test('enterMeeting is called correctly when a meeting is already present and active', async () => {
		useStore.getState().addMeetings([meetingMock]);
		await meetingsApi.enterMeeting(
			meetingMock.roomId,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/join`, RequestType.POST, {
			audioStreamEnabled: false,
			videoStreamEnabled: false
		});
	});

	test('enterMeeting is called correctly when a meeting is already present but not active', async () => {
		useStore.getState().addMeetings([meetingNotActiveMock]);
		await meetingsApi.enterMeeting(
			meetingNotActiveMock.roomId,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingNotActiveMock.id}/start`,
			RequestType.POST
		);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingNotActiveMock.id}/join`,
			RequestType.POST,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			}
		);
	});

	test('enterMeeting is called correctly when the meeting instance is not yet created', async () => {
		useStore.getState().addRooms([roomWithoutMeetingMock]);
		spyOnFetch.mockResolvedValueOnce(scheduledMeetingMock);

		await meetingsApi.enterMeeting(
			roomWithoutMeetingMock.id,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			},
			{}
		);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings`, RequestType.POST, {
			roomId: roomWithoutMeetingMock.id,
			meetingType: MeetingType.PERMANENT,
			name: roomWithoutMeetingMock.name
		});

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${scheduledMeetingMock.id}/start`,
			RequestType.POST
		);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${scheduledMeetingMock.id}/join`,
			RequestType.POST,
			{
				audioStreamEnabled: false,
				videoStreamEnabled: false
			}
		);
	});

	test('leaveMeeting for external user is called correctly', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		useStore.getState().setLoginInfo(guestUser.id, guestUser.name, guestUser.name, guestUser.type);
		await meetingsApi.leaveMeeting(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/leave`, RequestType.POST);
		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting).not.toBeDefined();
		expect(document.cookie).toBe('');
	});

	test('leaveMeeting for internal user is called correctly', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		await meetingsApi.leaveMeeting(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/leave`, RequestType.POST);
		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting).not.toBeDefined();
		expect(document.cookie).toBe('ZM_AUTH_TOKEN=123456789; ZX_AUTH_TOKEN=123456789');
	});

	test('leaveMeeting for internal user is rejected', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		await meetingsApi.leaveMeeting(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/leave`, RequestType.POST);
		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting).not.toBeDefined();
		expect(document.cookie).toBe('ZM_AUTH_TOKEN=123456789; ZX_AUTH_TOKEN=123456789');
	});

	test('leaveMeeting for external user is rejected', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		useStore.getState().setLoginInfo(guestUser.id, guestUser.name, guestUser.name, guestUser.type);

		await meetingsApi.leaveMeeting(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/leave`, RequestType.POST);
		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.activeMeeting).not.toBeDefined();
		expect(document.cookie).toBe('');
	});

	test('When a member leaves a scheduled meeting, he is also removed from temporary room', async () => {
		const temporaryRoom = createMockRoom({
			meetingId: meetingMock.id,
			type: RoomType.TEMPORARY,
			members: [createMockMember({ userId })]
		});
		const store = useStore.getState();
		store.addRooms([temporaryRoom]);

		await meetingsApi.leaveMeeting(meetingMock.id);

		expect(spyOnFetch).toBeCalledTimes(2);
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
		store.addRooms([temporaryRoom]);

		await meetingsApi.leaveMeeting(meetingMock.id);

		expect(spyOnFetch).toBeCalledTimes(1);
		// Check if store is correctly updated
		const updatedStore = useStore.getState();
		expect(updatedStore.rooms[temporaryRoom.id]).toBeDefined();
	});

	test('stopMeeting is called correctly', async () => {
		await meetingsApi.stopMeeting('meetingId');

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/stop`, RequestType.POST);
	});

	test('deleteMeeting is called correctly', async () => {
		await meetingsApi.deleteMeeting(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}`, RequestType.DELETE);
	});

	test('updateAudioStreamStatus is called to set audio enabled', async () => {
		ongoingMeetingSetup();
		await meetingsApi.updateAudioStreamStatus(meetingMock.id, true);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/audio`, RequestType.PUT, {
			enabled: true
		});
	});

	test('updateAudioStreamStatus is called to set audio disabled', async () => {
		ongoingMeetingSetup();
		await meetingsApi.updateAudioStreamStatus(meetingMock.id, false);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/audio`, RequestType.PUT, {
			enabled: false
		});
	});

	test('updateVideoStreamStatus is called to set video enabled', async () => {
		ongoingMeetingSetup();
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.VIDEO, true, sdpOffer);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/media`, RequestType.PUT, {
			type: STREAM_TYPE.VIDEO,
			enabled: true,
			sdp: sdpOffer
		});
	});

	test('updateVideoStreamStatus is called to set video disabled', async () => {
		ongoingMeetingSetup();
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.VIDEO, false);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/media`, RequestType.PUT, {
			type: STREAM_TYPE.VIDEO,
			enabled: false
		});
	});

	test('updateScreenStreamStatus is called to set screen share enabled', async () => {
		ongoingMeetingSetup();
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.SCREEN, true, sdpOffer);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/media`, RequestType.PUT, {
			type: STREAM_TYPE.SCREEN,
			enabled: true,
			sdp: sdpOffer
		});
	});

	test('updateScreenStreamStatus is called to set screen share disabled', async () => {
		ongoingMeetingSetup();
		await meetingsApi.updateMediaOffer(meetingMock.id, STREAM_TYPE.SCREEN, false);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/media`, RequestType.PUT, {
			type: STREAM_TYPE.SCREEN,
			enabled: false
		});
	});

	test('leaveWaitingRoom is called correctly for internal user', async () => {
		const cookie = `ZM_AUTH_TOKEN=123456789`;
		document.cookie = cookie;
		await meetingsApi.leaveWaitingRoom(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingMock.id}/queue/${userId}`,
			RequestType.POST,
			{
				status: 'REJECTED'
			}
		);
		expect(document.cookie).toBe(cookie);
	});

	test('leaveWaitingRoom is called correctly for guest user', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789`;
		useStore.getState().setLoginInfo(userId, guestUser.email, guestUser.name, guestUser.type);
		useStore.getState().setQueueId('queueId');
		await meetingsApi.leaveWaitingRoom(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingMock.id}/queue/${userId}`,
			RequestType.POST,
			{
				status: 'REJECTED'
			}
		);
		expect(document.cookie).toBe('');
	});

	test('getWaitingList is called correctly', async () => {
		await meetingsApi.getWaitingList(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/queue`, RequestType.GET);
	});

	test('acceptWaitingUser is called correctly', async () => {
		await meetingsApi.acceptWaitingUser(meetingMock.id, userId, true);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingMock.id}/queue/${userId}`,
			RequestType.POST,
			{
				status: 'ACCEPTED'
			}
		);
	});

	test('startRecording is called correctly', async () => {
		await meetingsApi.startRecording(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingMock.id}/startRecording`,
			RequestType.POST
		);
	});

	test('stopRecording is called correctly', async () => {
		await meetingsApi.stopRecording(meetingMock.id, 'recordingName', 'folderId');

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingMock.id}/stopRecording`,
			RequestType.POST,
			{
				name: 'recordingName',
				folderId: 'folderId'
			}
		);
	});

	test('createMediaAnswer is called correctly', async () => {
		await meetingsApi.createMediaAnswer(meetingMock.id, 'sdpAnswer');

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingMock.id}/media/answer`,
			RequestType.PUT,
			{
				sdp: 'sdpAnswer'
			}
		);
	});

	test('createAudioOffer is called correctly', async () => {
		await meetingsApi.createAudioOffer(meetingMock.id, 'sdpOffer');

		expect(spyOnFetch).toHaveBeenCalledWith(
			`meetings/${meetingMock.id}/audio/offer`,
			RequestType.PUT,
			{
				sdp: 'sdpOffer'
			}
		);
	});

	test('getScheduledMeetingName is called correctly', async () => {
		await meetingsApi.getScheduledMeetingName(meetingMock.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`public/meetings/${meetingMock.id}`, RequestType.GET);
	});

	test('authLogin is called correctly', async () => {
		const spyOnAuthLogin = spyOnMeetingsApi(MeetingsApiToSpy.AUTH_LOGIN).mockImplementation(() =>
			Promise.resolve(true)
		);
		spyOnAuthLogin.mockReturnValue(true);
		await meetingsApi.authLogin();

		expect(spyOnAuthLogin).toHaveBeenCalled();
	});

	test('createGuestAccount is called correctly', async () => {
		const spyOnCreateGuestAccount = spyOnMeetingsApi(
			MeetingsApiToSpy.CREATE_GUEST_ACCOUNT
		).mockReturnValue(() =>
			Promise.resolve({
				id: 'string',
				tokenId: 'string',
				zmToken: 'string',
				zxToken: 'string'
			})
		);
		await meetingsApi.createGuestAccount('userName');

		expect(spyOnCreateGuestAccount).toHaveBeenCalledWith('userName');
	});

	test('user raise hand', async () => {
		const spyOnRaiseHand = spyOnMeetingsApi(MeetingsApiToSpy.RAISE_HAND);
		ongoingMeetingSetup();

		await meetingsApi.raiseHand(meetingMock.id, true);
		expect(spyOnRaiseHand).toHaveBeenCalled();
	});

	test('User joins a meeting where some participants have raised their hands', async () => {
		spyOnFetch.mockResolvedValueOnce({ status: 'ACCEPTED' });
		const meeting = createMockMeeting({
			participants: [
				createMockParticipants({ userId: 'user1' }),
				createMockParticipants({
					userId: 'user2',
					handRaisedAt: dateToISODate('2023-01-01T00:10:02.000Z')
				}),
				createMockParticipants({
					userId: 'user3',
					handRaisedAt: dateToISODate('2023-01-01T00:10:03.000Z')
				}),
				createMockParticipants({
					userId: 'user4',
					handRaisedAt: dateToISODate('2023-01-01T00:10:01.000Z')
				})
			]
		});
		spyOnFetch.mockResolvedValueOnce(meeting);
		await meetingsApi.joinMeeting(
			meetingMock.id,
			{ audioStreamEnabled: false, videoStreamEnabled: false },
			{}
		);
		expect(spyOnFetch).toHaveBeenCalledWith(`meetings/${meetingMock.id}/join`, RequestType.POST, {
			audioStreamEnabled: false,
			videoStreamEnabled: false
		});
		const store = useStore.getState();
		expect(store.activeMeeting?.usersWithHandRaised[0]).toBe('user4');
		expect(store.activeMeeting?.usersWithHandRaised[1]).toBe('user2');
		expect(store.activeMeeting?.usersWithHandRaised[2]).toBe('user3');
	});
});
