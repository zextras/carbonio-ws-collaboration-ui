/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import RecordingTimer from './RecordingTimer';
import { setup } from '../../../../tests/test-utils';
import { dateToISODate } from '../../../../utils/dateUtils';

describe('RecordingTimer tests', () => {
	test('Recording starts now', () => {
		const startTime = dateToISODate(Date.now());
		setup(<RecordingTimer timestamp={startTime} />);
		expect(screen.getByText('00:00')).toBeVisible();
	});

	test('Recording starts 1 second ago', () => {
		const startTime = dateToISODate(Date.now() - 1 * 1000);
		setup(<RecordingTimer timestamp={startTime} />);
		expect(screen.getByText('00:01')).toBeVisible();
	});

	test('Recording starts 1 minute ago', () => {
		const startTime = dateToISODate(Date.now() - 1 * 60 * 1000);
		setup(<RecordingTimer timestamp={startTime} />);
		expect(screen.getByText('01:00')).toBeVisible();
	});

	test('Recording starts 1 hour, 20 minutes and 30 seconds ago', () => {
		const startTime = dateToISODate(Date.now() - 1 * 60 * 60 * 1000 - 20 * 60 * 1000 - 30 * 1000);
		setup(<RecordingTimer timestamp={startTime} />);
		expect(screen.getByText('01:20:30')).toBeVisible();
	});
});
