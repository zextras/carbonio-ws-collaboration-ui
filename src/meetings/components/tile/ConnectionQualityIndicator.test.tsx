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
const WIFI_OFF_ICON = 'icon: WifiOff';

beforeEach(() => {
	const store = useStore.getState();
	store.setApiVersion('1.6.15');
	store.addMeetings([mockMeeting]);
	store.meetingConnection(mockMeeting.id);
});

describe('ConnectionQualityIndicator', () => {
	it('renders nothing when there is no quality for the participant', () => {
		const { container } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />
		);
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing when the API version does not support connection quality', () => {
		useStore.getState().setApiVersion('1.6.14');
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, 10, 1);
		const { container } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing for a remote participant with a stable connection', () => {
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, USER_ID, 6, 1);
		const { container } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />
		);
		expect(container).toBeEmptyDOMElement();
	});

	it('shows the remote badge with its tooltip when the participant connection is unstable', async () => {
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, USER_ID, 4, 1);
		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />
		);
		await user.hover(screen.getByTestId('connection_quality_poor'));
		expect(await screen.findByText(/connection is unstable/)).toBeInTheDocument();
	});

	it('shows the WifiOff icon when a remote participant connection is lost', () => {
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, USER_ID, null, 1);
		setup(<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />);
		expect(screen.getByTestId(WIFI_OFF_ICON)).toBeInTheDocument();
	});

	it.each([
		[10, 'connection_quality_good', 'Your connection is stable'],
		[7, 'connection_quality_good', 'Your connection is stable'],
		[6, 'connection_quality_fair', 'Your connection is a bit unstable'],
		[4, 'connection_quality_poor', 'Your connection is unstable']
	])('shows the own indicator for score %s with its tooltip', async (score, testId, label) => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, score, 1);
		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		await user.hover(screen.getByTestId(testId));
		expect(await screen.findByText(label)).toBeInTheDocument();
	});

	it('shows the own lost state', async () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, null, 1);
		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		await user.hover(screen.getByTestId(WIFI_OFF_ICON));
		expect(await screen.findByText('Connection lost')).toBeInTheDocument();
	});
});
