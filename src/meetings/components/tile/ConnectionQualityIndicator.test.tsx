/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import ConnectionQualityIndicator from './ConnectionQualityIndicator';
import useStore from '../../../store/Store';
import { createMockMeeting } from '../../../tests/createMock';
import { screen, setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';

const mockMeeting: MeetingBe = createMockMeeting();
const USER_ID = 'other-user';
const ME_ID = 'me-user';

beforeEach(() => {
	const store = useStore.getState();
	store.addMeetings([mockMeeting]);
	store.meetingConnection(mockMeeting.id);
});

describe('ConnectionQualityIndicator', () => {
	it('renders nothing when the participant quality is stable (medium and above)', () => {
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, USER_ID, 'medium', 1);
		const { container } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />
		);
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing when there is no quality for the participant', () => {
		const { container } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />
		);
		expect(container).toBeEmptyDOMElement();
	});

	it('renders the WifiOff icon (not the bars) when the connection is lost', () => {
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, USER_ID, 'lost', 1);
		setup(<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />);
		expect(screen.getByTestId('icon: WifiOff')).toBeInTheDocument();
	});

	it('shows the raw rtt/jitter/loss detail on the own tile, with a — fallback for a missing value', async () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, 'lost', 1);
		useStore.getState().setConnectionScoreDetail({ rttMs: 100, jitterMs: 20, lossUp: 0.05 });

		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		await user.hover(screen.getByTestId('icon: WifiOff'));

		const detail = await screen.findByText(/RTT: 100 ms/);
		expect(detail).toHaveTextContent('Jitter: 20 ms');
		expect(detail).toHaveTextContent('Loss ↑: 5.0%');
		// lossDown was not measured this window -> em-dash fallback.
		expect(detail).toHaveTextContent('Loss ↓: —');
	});
});
