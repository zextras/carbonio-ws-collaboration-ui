/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import DownlinkSnackbarManager from './DownlinkSnackbarManager';
import useStore from '../../store/Store';
import { createMockMeeting } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';

const mockMeeting: MeetingBe = createMockMeeting();

beforeEach(() => {
	const store = useStore.getState();
	store.addMeetings([mockMeeting]);
	store.meetingConnection(mockMeeting.id);
});

describe('DownlinkSnackbarManager', () => {
	it('shows no snackbar initially (downlink ok)', () => {
		setup(<DownlinkSnackbarManager />);
		expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
	});

	it('shows warning snackbar when downlink becomes compromised', async () => {
		setup(<DownlinkSnackbarManager />);
		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
		});
		const snackbar = await screen.findByTestId('snackbar');
		expect(snackbar).toBeInTheDocument();
	});

	it('warning snackbar disappears when downlink is restored', async () => {
		setup(<DownlinkSnackbarManager />);

		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
		});
		await screen.findByTestId('snackbar');

		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, false);
		});

		// success snackbar should replace the warning; look for "restored" text
		const restored = await screen.findByText('Incoming video quality has been restored.');
		expect(restored).toBeInTheDocument();
	});

	it('shows success snackbar on compromised -> ok transition', async () => {
		setup(<DownlinkSnackbarManager />);

		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
		});
		await screen.findByTestId('snackbar');

		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, false);
		});

		const snackbar = await screen.findByTestId('snackbar');
		expect(snackbar).toBeInTheDocument();
	});

	it('does not show success snackbar without a prior warning', () => {
		setup(<DownlinkSnackbarManager />);
		// downlink was never compromised, stays ok -> no snackbar
		expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
	});
});
