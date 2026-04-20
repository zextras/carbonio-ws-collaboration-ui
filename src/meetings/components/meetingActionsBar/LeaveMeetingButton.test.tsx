/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import * as ReactRouter from 'react-router-dom';

import LeaveMeetingButton from './LeaveMeetingButton';
import * as api from '../../../network/apis/MeetingsApi';
import { createMockMeeting } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';

const mockMeeting: MeetingBe = createMockMeeting();

const leaveMeetingButtonText = 'Leave Meeting?';

beforeEach(() => {
	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: mockMeeting.id });
});

describe('LeaveMeetingButton', () => {
	test('Default button status: closed', () => {
		setup(<LeaveMeetingButton isHoovering />);
		const text = screen.queryByText(leaveMeetingButtonText);
		expect(text).not.toBeInTheDocument();
	});

	test('User clicks the button once: it should be open', async () => {
		const { user } = setup(<LeaveMeetingButton isHoovering />);
		const button = screen.getByRole('button');
		await user.click(button);
		const text = screen.getByText(leaveMeetingButtonText);
		expect(text).toBeInTheDocument();
	});

	test('User clicks twice the button: leaveMeeting should be called', async () => {
		const spyOnLeaveMeeting = vi.spyOn(api, 'leaveMeeting');
		const { user } = setup(<LeaveMeetingButton isHoovering />);
		const button = screen.getByRole('button');
		await user.click(button);
		await user.click(button);
		expect(spyOnLeaveMeeting).toHaveBeenCalled();
	});

	test('User leaves the meeting directly if component has the oneClickLeave prop', async () => {
		const spyOnLeaveMeeting = vi.spyOn(api, 'leaveMeeting');
		const { user } = setup(<LeaveMeetingButton isHoovering oneClickLeave />);
		await user.click(screen.getByRole('button'));
		expect(spyOnLeaveMeeting).toHaveBeenCalled();
	});
});
