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
	store.addMeetings([mockMeeting]);
	store.meetingConnection(mockMeeting.id);
});

describe('ConnectionQualityIndicator', () => {
	it('renders nothing when the participant quality is stable (medium and above)', () => {
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, USER_ID, 6, 1);
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
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, USER_ID, null, 1);
		setup(<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />);
		expect(screen.getByTestId(WIFI_OFF_ICON)).toBeInTheDocument();
	});

	it('always shows the own indicator even at a good (stable) quality', () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, 10, 1);
		const { container } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		expect(container).not.toBeEmptyDOMElement();
	});

	it('shows the vote-component scores on the own tile, with a — fallback for a missing signal', async () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, null, 1);
		// jitter undefined this window -> em-dash; rttScore(450)=2.1 (good 150), uplinkLossScore(0.07)=4.1 (bad 0.16).
		useStore.getState().setConnectionScoreDetail({ rttMs: 450, lossUp: 0.07 });

		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		await user.hover(screen.getByTestId(WIFI_OFF_ICON));

		const detail = await screen.findByText(/RTT: 2\.1\/10 \(450 ms\)/);
		expect(detail).toHaveTextContent('Jitter: —');
		expect(detail).toHaveTextContent('Uplink loss: 4.1/10 (7.0%)');
		expect(detail).toHaveTextContent('Score: —');
	});

	it('own-tile merged tooltip shows tier-weighted breakdown when connectionTierWeightedDetail is set', async () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		// networkScore=null → lost → WifiOff rendered (easy to hover), maxUplinkTier=1 (MED)
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, null, 1, 1, 2);
		useStore.getState().setConnectionScoreDetail({ rttMs: 100, jitterMs: 20, lossUp: 0.01 });
		useStore.getState().setConnectionTierWeightedDetail({
			networkScore: 8,
			tierWeightedNetworkScore: 5,
			uplinkPenalty: 3.0,
			downlinkPenalty: 1.5
		});

		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		await user.hover(screen.getByTestId(WIFI_OFF_ICON));

		const tooltip = await screen.findByText(/RTT:/);
		// uplinkPenalty=3.0 / K_UP(1.5) = 2 → "Uplink tier difference: -2"
		expect(tooltip).toHaveTextContent('Uplink tier difference: -2');
		// downlinkPenalty=1.5 / K_DOWN(3) = 0.5 → "Downlink avg tier difference: -0.5"
		expect(tooltip).toHaveTextContent('Downlink avg tier difference: -0.5');
		expect(tooltip).toHaveTextContent('Score: 5.0/10');
	});

	it('own-tile tier difference reads 0 (never -0) at the hardware ceiling', async () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, null, 1, 2, 2);
		useStore.getState().setConnectionTierWeightedDetail({
			networkScore: 10,
			tierWeightedNetworkScore: 10,
			uplinkPenalty: 0,
			downlinkPenalty: 0
		});
		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		await user.hover(screen.getByTestId(WIFI_OFF_ICON));
		const tooltip = await screen.findByText(/Score:/);
		expect(tooltip).toHaveTextContent('Uplink tier difference: 0');
		expect(tooltip).toHaveTextContent('Downlink avg tier difference: 0');
		expect(tooltip).not.toHaveTextContent('-0');
	});

	it('own-tile merged tooltip shows — for null coefficients (webcam off / no feeds)', async () => {
		useStore.getState().setLoginInfo({ id: ME_ID });
		// networkScore=null → lost → WifiOff rendered
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, ME_ID, null, 1);
		useStore.getState().setConnectionTierWeightedDetail({
			networkScore: 8,
			tierWeightedNetworkScore: null,
			uplinkPenalty: null,
			downlinkPenalty: null
		});

		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={ME_ID} />
		);
		await user.hover(screen.getByTestId(WIFI_OFF_ICON));

		const tooltip = await screen.findByText(/Score:/);
		expect(tooltip).toHaveTextContent('Uplink tier difference: -');
		expect(tooltip).toHaveTextContent('Downlink avg tier difference: -');
		expect(tooltip).toHaveTextContent('Score: —');
	});

	it('remote tile renders on unstable connection and shows lean tooltip with tier info', async () => {
		// networkScore=null → lost → WifiOff, maxUplinkTier=2 (HIGH)
		useStore.getState().setParticipantConnectionQuality(mockMeeting.id, USER_ID, null, 1, 2, 2);
		const { user } = setup(
			<ConnectionQualityIndicator meetingId={mockMeeting.id} userId={USER_ID} />
		);
		expect(screen.getByTestId(WIFI_OFF_ICON)).toBeInTheDocument();
		await user.hover(screen.getByTestId(WIFI_OFF_ICON));

		const tooltip = await screen.findByText(/Connection lost/);
		expect(tooltip).toHaveTextContent('Uplink: HIGH');
	});
});
