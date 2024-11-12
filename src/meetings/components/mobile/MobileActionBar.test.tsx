/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';
import * as ReactRouter from 'react-router';

import MobileActionBar from './MobileActionBar';
import useStore from '../../../store/Store';
import { createMockMeeting } from '../../../tests/createMock';
import { MeetingsApiToSpy, spyOnMeetingsApi } from '../../../tests/mocks/network';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { MobileMeetingView } from '../../views/mobile/MeetingSkeletonMobile';

const mockMeeting: MeetingBe = createMockMeeting();

beforeAll(() => {
	const spyUseParams = jest.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: mockMeeting.id });
});

describe('MobileActionBar test', () => {
	test('Set participants view', async () => {
		const setView = jest.fn();
		const { user } = setup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={setView}
			/>
		);
		const participantsButton = screen.getByTestId('icon: People');
		expect(participantsButton).toBeInTheDocument();

		await user.click(participantsButton);
		expect(setView).toHaveBeenCalledWith(MobileMeetingView.PARTICIPANTS);
	});

	test('Set conversation view', async () => {
		const setView = jest.fn();
		const { user } = setup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={setView}
			/>
		);
		const conversationButton = screen.getByTestId('icon: MessageCircle');
		expect(conversationButton).toBeInTheDocument();

		await user.click(conversationButton);
		expect(setView).toHaveBeenCalledWith(MobileMeetingView.CHAT);
	});

	test('Leave meeting button', async () => {
		const spyOnLeaveMeeting = spyOnMeetingsApi(MeetingsApiToSpy.LEAVE_MEETING);
		const { user } = setup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={jest.fn()}
			/>
		);
		const leaveButton = screen.getByTestId('icon: LogOutOutline');
		expect(leaveButton).toBeInTheDocument();

		await user.click(leaveButton);
		expect(spyOnLeaveMeeting).toHaveBeenCalled();
	});

	test('Toggle audio stream', async () => {
		const spyOnUpdateAudioStreamStatus = spyOnMeetingsApi(
			MeetingsApiToSpy.UPDATE_AUDIO_STREAM_STATUS
		);
		const store = useStore.getState();
		store.setLoginInfo('userId', 'User');
		store.addMeeting(mockMeeting);
		store.addParticipant(mockMeeting.id, {
			userId: 'userId',
			audioStreamOn: false,
			joinedAt: ''
		});

		const { user } = setup(
			<MobileActionBar
				meetingId={mockMeeting.id}
				view={MobileMeetingView.TILES}
				setView={jest.fn()}
			/>
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
});
