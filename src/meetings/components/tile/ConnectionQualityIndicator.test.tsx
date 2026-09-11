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

	it('always shows the own indicator even at a good (stable) quality', () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, 'optimal', 1);
		const { container } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		expect(container).not.toBeEmptyDOMElement();
	});

	it('shows the vote-component scores on the own tile, with a — fallback for a missing signal', async () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, 'lost', 1);
		// jitter undefined this window -> em-dash; rttScore(450)=2.5, uplinkLossScore(0.07)=5.6.
		useStore.getState().setConnectionScoreDetail({ rttMs: 450, lossUp: 0.07 });

		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		await user.hover(screen.getByTestId('icon: WifiOff'));

		const detail = await screen.findByText(/RTT: 2\.5\/10 \(450 ms\)/);
		expect(detail).toHaveTextContent('Jitter: —');
		expect(detail).toHaveTextContent('Uplink loss: 5.6/10 (7.0%)');
	});
});
