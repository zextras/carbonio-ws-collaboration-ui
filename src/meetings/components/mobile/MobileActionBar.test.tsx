/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import MobileActionBar from './MobileActionBar';
import * as api from '../../../network/apis/MeetingsApi';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { routerContextSetup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import * as UserMediaManager from '../../../utils/UserMediaManager';
import { MobileMeetingView } from '../../views/mobile/MeetingSkeletonMobile';

const mockMeeting: MeetingBe = createMockMeeting();
const mockRoom: RoomBe = createMockRoom({
	id: mockMeeting.roomId,
	type: RoomType.GROUP,
	members: [{ userId: 'userId', owner: true }]
});

describe('MobileActionBar test', () => {
	test('Set participants view', async () => {
		const setView = vi.fn();
		const { user } = routerContextSetup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={setView}
			/>,
			{ meetingId: mockMeeting.id }
		);
		const participantsButton = screen.getByTestId('icon: People');
		expect(participantsButton).toBeInTheDocument();

		await user.click(participantsButton);
		expect(setView).toHaveBeenCalledWith(MobileMeetingView.PARTICIPANTS);
	});

	test('Set conversation view', async () => {
		const setView = vi.fn();
		const { user } = routerContextSetup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={setView}
			/>,
			{ meetingId: mockMeeting.id }
		);
		const conversationButton = screen.getByTestId('icon: MessageCircle');
		expect(conversationButton).toBeInTheDocument();

		await user.click(conversationButton);
		expect(setView).toHaveBeenCalledWith(MobileMeetingView.CHAT);
	});

	test('Leave meeting button', async () => {
		const spyOnLeaveMeeting = vi.spyOn(api, 'leaveMeeting');
		const { user } = routerContextSetup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={vi.fn()}
			/>,
			{ meetingId: mockMeeting.id }
		);
		const leaveButton = screen.getByTestId('icon: LogOutOutline');
		expect(leaveButton).toBeInTheDocument();

		await user.click(leaveButton);
		expect(spyOnLeaveMeeting).toHaveBeenCalled();
	});

	test('Toggle audio stream', async () => {
		const spyOnUpdateAudioStreamStatus = vi.spyOn(api, 'updateAudioStreamStatus');
		const store = useStore.getState();
		store.setLoginInfo({ id: 'userId', name: 'User' });
		store.addMeetings([mockMeeting]);
		store.addParticipant(mockMeeting.id, {
			userId: 'userId',
			audioStreamOn: false,
			joinedAt: ''
		});

		const { user } = routerContextSetup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={vi.fn()}
			/>,
			{ meetingId: mockMeeting.id }
		);
		const audioButtonOff = screen.getByTestId('icon: MicOff');
		expect(audioButtonOff).toBeInTheDocument();

		await user.click(audioButtonOff);
		act(() => {
			store.changeStreamStatus(mockMeeting.id, 'userId', STREAM_TYPE.AUDIO, true);
		});
		const audioButtonOn = screen.getByTestId('icon: Mic');
		expect(audioButtonOn).toBeInTheDocument();

		await user.click(audioButtonOn);
		expect(spyOnUpdateAudioStreamStatus).toHaveBeenCalled();
	});

	test('Toggle video stream: updates local stream track when peer connection already exists', async () => {
		const spyOnUpdateMediaOffer = vi.spyOn(api, 'updateMediaOffer');
		const fakeStream = {} as MediaStream;
		const spyOnGetFrontCameraStream = vi
			.spyOn(UserMediaManager, 'getFrontCameraStream')
			.mockResolvedValue(fakeStream);

		const store = useStore.getState();
		store.setLoginInfo({ id: 'userId', name: 'User' });
		store.addRooms([mockRoom]);
		store.addMeetings([mockMeeting]);
		store.meetingConnection(mockMeeting.id);

		const videoOutConn = useStore.getState().activeMeeting?.videoOutConn;
		videoOutConn!.peerConn = {} as RTCPeerConnection;
		const updateTrackSpy = vi
			.spyOn(videoOutConn!, 'updateLocalStreamTrack')
			.mockResolvedValue({} as MediaStreamTrack);

		const { user } = routerContextSetup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={vi.fn()}
			/>,
			{ meetingId: mockMeeting.id }
		);
		const videoButtonOff = screen.getByTestId('icon: VideoOff');
		await act(() => user.click(videoButtonOff));

		expect(spyOnGetFrontCameraStream).toHaveBeenCalled();
		expect(updateTrackSpy).toHaveBeenCalledWith(fakeStream);
		expect(spyOnUpdateMediaOffer).toHaveBeenCalledWith(mockMeeting.id, STREAM_TYPE.VIDEO, true);
	});

	test('Toggle video stream: stops the video when video is already on', async () => {
		const store = useStore.getState();
		store.setLoginInfo({ id: 'userId', name: 'User' });
		store.addRooms([mockRoom]);
		store.addMeetings([mockMeeting]);
		store.addParticipant(mockMeeting.id, {
			userId: 'userId',
			videoStreamOn: true,
			joinedAt: ''
		});
		store.meetingConnection(mockMeeting.id);

		const videoOutConn = useStore.getState().activeMeeting?.videoOutConn;
		const stopVideoSpy = vi.spyOn(videoOutConn!, 'stopVideo').mockImplementation(() => {});

		const { user } = routerContextSetup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={vi.fn()}
			/>,
			{ meetingId: mockMeeting.id }
		);
		const videoButtonOn = screen.getByTestId('icon: Video');
		await user.click(videoButtonOn);
		expect(stopVideoSpy).toHaveBeenCalled();
	});
});
