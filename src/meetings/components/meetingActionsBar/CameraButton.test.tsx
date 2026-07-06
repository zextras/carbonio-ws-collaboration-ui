/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import CameraButton from './CameraButton';
import * as api from '../../../network/apis/MeetingsApi';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { routerContextSetup, setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import * as UserMediaManager from '../../../utils/UserMediaManager';

const mockMeeting: MeetingBe = createMockMeeting();
const mockRoom: RoomBe = createMockRoom({
	id: mockMeeting.roomId,
	type: RoomType.GROUP,
	members: [{ userId: 'userId', owner: true }]
});

const activeMeetingSetup = (videoStreamOn: boolean): void => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'userId', name: 'User' });
	store.setWebsocketStatus(true);
	store.addRooms([mockRoom]);
	store.addMeetings([mockMeeting]);
	store.addParticipant(mockMeeting.id, {
		userId: 'userId',
		videoStreamOn,
		joinedAt: ''
	});
	store.meetingConnection(mockMeeting.id);
};

const cameraButtonComponent = (
	<CameraButton
		videoDropdownRef={React.createRef<HTMLDivElement>()}
		isVideoListOpen={false}
		setIsVideoListOpen={vi.fn()}
	/>
);

describe('Camera button', () => {
	test('Should render the component', async () => {
		setup(
			<CameraButton
				videoDropdownRef={React.createRef<HTMLDivElement>()}
				isVideoListOpen={false}
				setIsVideoListOpen={vi.fn()}
			/>
		);
		expect(await screen.findByTestId('cameraButton')).toBeVisible();
	});

	test('Toggle list of video inputs', async () => {
		const mockSetIsVideoListOpen = vi.fn();
		useStore.getState().setWebsocketStatus(true);
		const { user } = setup(
			<CameraButton
				videoDropdownRef={React.createRef<HTMLDivElement>()}
				isVideoListOpen={false}
				setIsVideoListOpen={mockSetIsVideoListOpen}
			/>
		);
		const multiButtonToggleList = await screen.findByTestId('icon: ChevronUp');
		await user.click(multiButtonToggleList);
		expect(mockSetIsVideoListOpen).toHaveBeenCalled();
	});

	test('Camera button is disabled when websocket is down', async () => {
		useStore.getState().setWebsocketStatus(false);
		setup(
			<CameraButton
				videoDropdownRef={React.createRef<HTMLDivElement>()}
				isVideoListOpen={false}
				setIsVideoListOpen={vi.fn()}
			/>
		);
		const cameraButton = await screen.findByTestId('cameraButton');
		expect(cameraButton).toBeDisabled();
	});

	test('Camera button is disabled when message broker is down', async () => {
		useStore.getState().setMessageBrokerStatus(false);
		setup(
			<CameraButton
				videoDropdownRef={React.createRef<HTMLDivElement>()}
				isVideoListOpen={false}
				setIsVideoListOpen={vi.fn()}
			/>
		);
		const cameraButton = await screen.findByTestId('cameraButton');
		expect(cameraButton).toBeDisabled();
	});

	test('Camera button is disabled while enabling video and re-enabled when stream status updates', async () => {
		activeMeetingSetup(false);
		vi.spyOn(UserMediaManager, 'getVideoStream').mockResolvedValue({} as MediaStream);
		vi.spyOn(api, 'updateMediaOffer').mockResolvedValue({} as Response);

		const videoOutConn = useStore.getState().activeMeeting?.videoOutConn;
		videoOutConn!.peerConn = {} as RTCPeerConnection;
		vi.spyOn(videoOutConn!, 'updateLocalStreamTrack').mockResolvedValue({} as MediaStreamTrack);

		const { user } = routerContextSetup(cameraButtonComponent, { meetingId: mockMeeting.id });
		const cameraButton = await screen.findByTestId('cameraButton');
		await waitFor(() => expect(cameraButton).toBeEnabled());

		await user.click(cameraButton);
		expect(cameraButton).toBeDisabled();

		act(() => {
			useStore.getState().changeStreamStatus(mockMeeting.id, 'userId', STREAM_TYPE.VIDEO, true);
		});
		expect(cameraButton).toBeEnabled();
	});

	test('Camera button is re-enabled when updateMediaOffer fails', async () => {
		activeMeetingSetup(false);
		vi.spyOn(UserMediaManager, 'getVideoStream').mockResolvedValue({} as MediaStream);
		vi.spyOn(api, 'updateMediaOffer').mockRejectedValue(new Error('Controlled error'));

		const videoOutConn = useStore.getState().activeMeeting?.videoOutConn;
		videoOutConn!.peerConn = {} as RTCPeerConnection;
		vi.spyOn(videoOutConn!, 'updateLocalStreamTrack').mockResolvedValue({} as MediaStreamTrack);

		const { user } = routerContextSetup(cameraButtonComponent, { meetingId: mockMeeting.id });
		const cameraButton = await screen.findByTestId('cameraButton');
		await waitFor(() => expect(cameraButton).toBeEnabled());

		await user.click(cameraButton);
		await waitFor(() => expect(cameraButton).toBeEnabled());
	});

	test('Camera button is re-enabled when stopVideo fails', async () => {
		activeMeetingSetup(true);
		const videoOutConn = useStore.getState().activeMeeting?.videoOutConn;
		vi.spyOn(videoOutConn!, 'stopVideo').mockRejectedValue(new Error('Controlled error'));

		const { user } = routerContextSetup(cameraButtonComponent, { meetingId: mockMeeting.id });
		const cameraButton = await screen.findByTestId('cameraButton');
		await waitFor(() => expect(cameraButton).toBeEnabled());

		await user.click(cameraButton);
		await waitFor(() => expect(cameraButton).toBeEnabled());
	});
});
