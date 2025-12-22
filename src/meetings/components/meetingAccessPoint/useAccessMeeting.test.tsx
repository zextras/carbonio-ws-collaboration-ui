/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook, waitFor } from '@testing-library/react';

import { MediaStatus } from './externalAccess/MeetingExternalAccessPage';
import useAccessMeeting from './useAccessMeeting';
import { MEETINGS_PATH } from '../../../constants/appConstants';
import { mockGoToInfoPage, mockGoToMeetingPage } from '../../../hooks/__mocks__/useRouting';
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import meetingsApi from '../../../network/apis/MeetingsApi';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { dateToISODate, now } from '../../../utils/dateUtils';

const mediaStatus: MediaStatus = {
	audio: { enabled: true, selectedDeviceId: 'audio-device-1' },
	video: { enabled: true, selectedDeviceId: 'video-device-1' }
};

const room = createMockRoom({ id: 'test-roomId', meetingId: 'test-meeting-id' });
const meeting = createMockMeeting({ id: room.meetingId, roomId: room.id });

vi.mock('../../../hooks/useRouting');

beforeEach(() => {
	useStore.getState().addRooms([room]);
	useStore.getState().addMeetings([meeting]);
});
describe('useAccessMeeting tests', () => {
	test('handleEnterMeeting redirect to meeting', async () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${room.meetingId}`;
		const spyOnEnterMeeting = vi.spyOn(meetingsApi, 'enterMeeting');
		const { result } = renderHook(() => useAccessMeeting(mediaStatus));
		result.current.handleEnterMeeting();
		expect(spyOnEnterMeeting).toHaveBeenCalledWith(
			room.id,
			{ videoStreamEnabled: true, audioStreamEnabled: true },
			{
				audioDevice: mediaStatus.audio.selectedDeviceId,
				videoDevice: mediaStatus.video.selectedDeviceId
			}
		);
	});

	test('handleWaitingRoom use mediaStatus', async () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${room.meetingId}`;
		const spyOnJoinMeeting = vi.spyOn(meetingsApi, 'joinMeeting');
		const { result } = renderHook(() => useAccessMeeting(mediaStatus));
		result.current.handleWaitingRoom();
		expect(spyOnJoinMeeting).toHaveBeenCalledWith(
			room.meetingId,
			{ videoStreamEnabled: true, audioStreamEnabled: true },
			{ audioDevice: 'audio-device-1', videoDevice: 'video-device-1' }
		);
	});

	test('Handle MEETING_WAITING_PARTICIPANT_REJECTED event', () => {
		renderHook(() => useAccessMeeting(mediaStatus));
		sendCustomEvent({
			name: EventName.MEETING_WAITING_PARTICIPANT_REJECTED,
			data: {
				meetingId: room.meetingId!,
				sentDate: dateToISODate(now()),
				type: WsEventType.MEETING_WAITING_PARTICIPANT_REJECTED,
				userId: 'test-user-id'
			}
		});
		expect(mockGoToInfoPage).toHaveBeenCalled();
	});

	test('Handle MEETING_WAITING_PARTICIPANT_CLASHED event', () => {
		renderHook(() => useAccessMeeting(mediaStatus));
		sendCustomEvent({
			name: EventName.MEETING_WAITING_PARTICIPANT_CLASHED,
			data: {
				meetingId: room.meetingId!,
				sentDate: dateToISODate(now()),
				type: WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED
			}
		});
		expect(mockGoToInfoPage).toHaveBeenCalled();
	});

	test('handleLeave handle leaving the waiting room', async () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${room.meetingId}`;
		vi.spyOn(meetingsApi, 'joinMeeting').mockResolvedValueOnce({ status: 'WAITING' });
		const spyOnLeaveWaitingRoom = vi.spyOn(meetingsApi, 'leaveWaitingRoom');
		const { result } = renderHook(() => useAccessMeeting(mediaStatus));
		result.current.handleWaitingRoom();
		await waitFor(() => {
			expect(result.current.userIsReady).toEqual(true);
		});
		await result.current.handleLeave();
		expect(spyOnLeaveWaitingRoom).toHaveBeenCalled();
	});

	test('Accepted user in waiting room is redirected to meeting', async () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${room.meetingId}`;
		vi.spyOn(meetingsApi, 'joinMeeting').mockResolvedValueOnce({ status: 'ACCEPTED' });
		renderHook(() => useAccessMeeting(mediaStatus));
		sendCustomEvent({
			name: EventName.MEETING_WAITING_PARTICIPANT_ACCEPTED,
			data: {
				meetingId: room.meetingId!,
				sentDate: dateToISODate(now()),
				type: WsEventType.MEETING_WAITING_PARTICIPANT_ACCEPTED,
				userId: 'test-user-id'
			}
		});
		await waitFor(() => {
			expect(mockGoToMeetingPage).toHaveBeenCalledWith(room.meetingId);
		});
	});
});
