/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import MicrophoneButton from './MicrophoneButton';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { routerContextSetup, setup } from '../../../tests/test-utils';
import * as UserMediaManager from '../../../utils/UserMediaManager';
import * as api from 'wsc-shared';
import { MeetingBe, RoomBe, STREAM_TYPE, RoomType } from 'wsc-shared';

const buttonDataTestId = 'microphone-button';

const mockMeeting: MeetingBe = createMockMeeting();
const mockRoom: RoomBe = createMockRoom({
	id: mockMeeting.roomId,
	type: RoomType.GROUP,
	members: [{ userId: 'userId', owner: true }]
});

const activeMeetingSetup = (audioStreamOn: boolean): void => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'userId', name: 'User' });
	store.setWebsocketStatus(true);
	store.addRooms([mockRoom]);
	store.addMeetings([mockMeeting]);
	store.addParticipant(mockMeeting.id, {
		userId: 'userId',
		audioStreamOn,
		joinedAt: ''
	});
	store.meetingConnection(mockMeeting.id);
};

const microphoneButtonComponent = (
	<MicrophoneButton
		audioDropdownRef={React.createRef<HTMLDivElement>()}
		isAudioListOpen={false}
		setIsAudioListOpen={vi.fn()}
	/>
);

describe('Microphone button', () => {
	test('Should render the component', async () => {
		setup(
			<MicrophoneButton
				audioDropdownRef={React.createRef<HTMLDivElement>()}
				isAudioListOpen={false}
				setIsAudioListOpen={vi.fn()}
			/>
		);
		expect(await screen.findByTestId(buttonDataTestId)).toBeVisible();
	});

	test('Toggle list of audio inputs', async () => {
		const mockSetIsAudioListOpen = vi.fn();
		useStore.getState().setWebsocketStatus(true);
		const { user } = setup(
			<MicrophoneButton
				audioDropdownRef={React.createRef<HTMLDivElement>()}
				isAudioListOpen={false}
				setIsAudioListOpen={mockSetIsAudioListOpen}
			/>
		);
		const multiButtonToggleList = await screen.findByTestId('icon: ChevronUp');
		await user.click(multiButtonToggleList);
		expect(mockSetIsAudioListOpen).toHaveBeenCalled();
	});

	test('Microphone button is disabled when websocket is down', async () => {
		useStore.getState().setWebsocketStatus(false);
		setup(
			<MicrophoneButton
				audioDropdownRef={React.createRef<HTMLDivElement>()}
				isAudioListOpen={false}
				setIsAudioListOpen={vi.fn()}
			/>
		);
		expect(await screen.findByTestId(buttonDataTestId)).toBeDisabled();
	});

	test('Microphone button is disabled when message broker is down', async () => {
		useStore.getState().setMessageBrokerStatus(false);
		setup(
			<MicrophoneButton
				audioDropdownRef={React.createRef<HTMLDivElement>()}
				isAudioListOpen={false}
				setIsAudioListOpen={vi.fn()}
			/>
		);
		expect(await screen.findByTestId(buttonDataTestId)).toBeDisabled();
	});

	test('Microphone button is disabled while enabling audio and re-enabled when stream status updates', async () => {
		activeMeetingSetup(false);
		vi.spyOn(UserMediaManager, 'getAudioStream').mockResolvedValue({} as MediaStream);
		vi.spyOn(api, 'updateAudioStreamStatus').mockResolvedValue({} as Response);

		const bidirectionalAudioConn = useStore.getState().activeMeeting?.bidirectionalAudioConn;
		vi.spyOn(bidirectionalAudioConn!, 'updateLocalStreamTrack').mockResolvedValue(
			{} as MediaStreamTrack
		);

		const { user } = routerContextSetup(microphoneButtonComponent, { meetingId: mockMeeting.id });
		const microphoneButton = await screen.findByTestId(buttonDataTestId);
		await waitFor(() => expect(microphoneButton).toBeEnabled());

		await user.click(microphoneButton);
		expect(microphoneButton).toBeDisabled();

		act(() => {
			useStore.getState().changeStreamStatus(mockMeeting.id, 'userId', STREAM_TYPE.AUDIO, true);
		});
		expect(microphoneButton).toBeEnabled();
	});

	test('Microphone button is re-enabled when updateAudioStreamStatus fails on enabling', async () => {
		activeMeetingSetup(false);
		vi.spyOn(UserMediaManager, 'getAudioStream').mockResolvedValue({} as MediaStream);
		vi.spyOn(api, 'updateAudioStreamStatus').mockRejectedValue(new Error('Controlled error'));

		const bidirectionalAudioConn = useStore.getState().activeMeeting?.bidirectionalAudioConn;
		vi.spyOn(bidirectionalAudioConn!, 'updateLocalStreamTrack').mockResolvedValue(
			{} as MediaStreamTrack
		);

		const { user } = routerContextSetup(microphoneButtonComponent, { meetingId: mockMeeting.id });
		const microphoneButton = await screen.findByTestId(buttonDataTestId);
		await waitFor(() => expect(microphoneButton).toBeEnabled());

		await user.click(microphoneButton);
		await waitFor(() => expect(microphoneButton).toBeEnabled());
	});

	test('Microphone button is re-enabled when updateAudioStreamStatus fails on disabling', async () => {
		activeMeetingSetup(true);
		vi.spyOn(api, 'updateAudioStreamStatus').mockRejectedValue(new Error('Controlled error'));

		const bidirectionalAudioConn = useStore.getState().activeMeeting?.bidirectionalAudioConn;
		vi.spyOn(bidirectionalAudioConn!, 'closeRtpSenderTrack').mockImplementation(() => {});

		const { user } = routerContextSetup(microphoneButtonComponent, { meetingId: mockMeeting.id });
		const microphoneButton = await screen.findByTestId(buttonDataTestId);
		await waitFor(() => expect(microphoneButton).toBeEnabled());

		await user.click(microphoneButton);
		await waitFor(() => expect(microphoneButton).toBeEnabled());
	});
});
