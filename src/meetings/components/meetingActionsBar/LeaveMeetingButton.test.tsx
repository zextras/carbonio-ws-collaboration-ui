/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import LeaveMeetingButton from './LeaveMeetingButton';
import { useParams } from '../../../../__mocks__/react-router';
import { createMockMeeting } from '../../../tests/createMock';
import { mockedLeaveMeetingRequest } from '../../../tests/mocks/network';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';

const mockMeeting: MeetingBe = createMockMeeting();

const leaveMeetingButtonText = 'Leave Meeting?';

beforeAll(() => {
	useParams.mockReturnValue({ meetingId: mockMeeting.id });
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
		mockedLeaveMeetingRequest.mockResolvedValueOnce('Meeting left');
		const { user } = setup(<LeaveMeetingButton isHoovering />);
		const button = screen.getByRole('button');
		await user.click(button);
		await user.click(button);
		expect(mockedLeaveMeetingRequest).toHaveBeenCalled();
	});
});
