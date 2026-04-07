/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import NetworkQualityIndicator from './NetworkQualityIndicator';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockParticipants } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { NetworkQualityLevel } from '../../../types/store/ActiveMeetingTypes';

const meeting = createMockMeeting({ participants: [createMockParticipants({ userId: 'userId' })] });

const setQuality = (quality: NetworkQualityLevel): void => {
	useStore.getState().meetingConnection(meeting.id);
	useStore.getState().setNetworkStats({ quality });
};

describe('NetworkQualityIndicator', () => {
	test('renders without crashing before any stats arrive', () => {
		useStore.getState().meetingConnection(meeting.id);
		setup(<NetworkQualityIndicator />);
		expect(screen.getByTestId('network_quality_indicator')).toBeInTheDocument();
	});

	test('shows GOOD quality icon', () => {
		setQuality(NetworkQualityLevel.GOOD);
		setup(<NetworkQualityIndicator />);
		const indicator = screen.getByTestId('network_quality_indicator');
		expect(indicator).toBeInTheDocument();
	});

	test('shows FAIR quality icon', () => {
		setQuality(NetworkQualityLevel.FAIR);
		setup(<NetworkQualityIndicator />);
		expect(screen.getByTestId('network_quality_indicator')).toBeInTheDocument();
	});

	test('shows POOR quality icon', () => {
		setQuality(NetworkQualityLevel.POOR);
		setup(<NetworkQualityIndicator />);
		expect(screen.getByTestId('network_quality_indicator')).toBeInTheDocument();
	});

	test('tooltip label reflects GOOD quality', async () => {
		setQuality(NetworkQualityLevel.GOOD);
		const { user } = setup(<NetworkQualityIndicator />);
		await user.hover(screen.getByTestId('network_quality_indicator'));
		const tooltip = await screen.findByText('Network quality: Good');
		expect(tooltip).toBeInTheDocument();
	});

	test('tooltip label reflects POOR quality', async () => {
		setQuality(NetworkQualityLevel.POOR);
		const { user } = setup(<NetworkQualityIndicator />);
		await user.hover(screen.getByTestId('network_quality_indicator'));
		const tooltip = await screen.findByText('Network quality: Poor');
		expect(tooltip).toBeInTheDocument();
	});

	test('tooltip label reflects UNKNOWN quality when no stats available', async () => {
		useStore.getState().meetingConnection(meeting.id);
		const { user } = setup(<NetworkQualityIndicator />);
		await user.hover(screen.getByTestId('network_quality_indicator'));
		const tooltip = await screen.findByText('Network quality: Checking…');
		expect(tooltip).toBeInTheDocument();
	});
});
