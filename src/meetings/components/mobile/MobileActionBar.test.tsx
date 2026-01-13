/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import MobileActionBar from './MobileActionBar';
import meetingsApi from '../../../network/apis/MeetingsApi';
import useStore from '../../../store/Store';
import { createMockMeeting } from '../../../tests/createMock';
import { routerContextSetup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { MobileMeetingView } from '../../views/mobile/MeetingSkeletonMobile';

const mockMeeting: MeetingBe = createMockMeeting();

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
		const spyOnLeaveMeeting = vi.spyOn(meetingsApi, 'leaveMeeting');
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
		const spyOnUpdateAudioStreamStatus = vi.spyOn(meetingsApi, 'updateAudioStreamStatus');
		const store = useStore.getState();
		store.setLoginInfo('userId', 'User');
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
});
