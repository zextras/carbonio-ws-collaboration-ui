/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import DownlinkSnackbarManager from './DownlinkSnackbarManager';
import useStore from '../../store/Store';
import { createMockMeeting } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';

const mockMeeting: MeetingBe = createMockMeeting();
const warningLabel = 'Your connection is unstable and video quality is already at the minimum.';

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

		// success snackbar should replace the warning; look for the recovery text
		const restored = await screen.findByText('Your connection has recovered.');
		expect(restored).toBeInTheDocument();
	});

	it('shows the recovery (success) snackbar by its text on a compromised -> ok transition', async () => {
		setup(<DownlinkSnackbarManager />);

		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
		});
		await screen.findByText(warningLabel);

		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, false);
		});

		// The recovery snackbar is the success one, identified by its own copy — not the generic testId.
		expect(await screen.findByText('Your connection has recovered.')).toBeInTheDocument();
	});

	it('does not show success snackbar without a prior warning', () => {
		setup(<DownlinkSnackbarManager />);
		// downlink was never compromised, stays ok -> no snackbar
		expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
	});

	it('OK dismisses the warning and it stays hidden while still compromised', async () => {
		const { user } = setup(<DownlinkSnackbarManager />);
		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
		});
		await screen.findByText(warningLabel);

		await user.click(screen.getByRole('button', { name: /ok/i }));

		// the store is STILL compromised, but the user dismissed it -> gone and it does not re-pop
		await waitFor(() => expect(screen.queryByText(warningLabel)).not.toBeInTheDocument());
	});

	it('re-arms the dismiss latch: after OK, a restore then a fresh degradation shows the warning again', async () => {
		const { user } = setup(<DownlinkSnackbarManager />);

		// Degrade → warning shows; dismiss it via OK while still compromised.
		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
		});
		await screen.findByText(warningLabel);
		await user.click(screen.getByRole('button', { name: /ok/i }));
		await waitFor(() => expect(screen.queryByText(warningLabel)).not.toBeInTheDocument());

		// Restore, then a NEW degradation edge must re-arm the latch so the warning reappears.
		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, false);
		});
		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
		});
		expect(await screen.findByText(warningLabel)).toBeInTheDocument();
	});

	it('hides the quality warning while a connection is down (yields to the connection snackbar)', async () => {
		setup(<DownlinkSnackbarManager />);
		act(() => {
			useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
		});
		await screen.findByText(warningLabel);

		// A websocket drop means the connection snackbars own the screen -> quality warning must yield.
		act(() => {
			useStore.getState().setWebsocketStatus(false);
		});
		await waitFor(() => expect(screen.queryByText(warningLabel)).not.toBeInTheDocument());
	});

	it('keeps the quality warning suppressed during the reconnect grace, then restores it', () => {
		vi.useFakeTimers();
		try {
			setup(<DownlinkSnackbarManager />);
			// Connection down first, then a fresh degradation while down -> suppressed (not shown).
			act(() => {
				useStore.getState().setWebsocketStatus(false);
			});
			act(() => {
				useStore.getState().setDownlinkCompromised(mockMeeting.id, true);
			});
			expect(screen.queryByText(warningLabel)).not.toBeInTheDocument();

			// Websocket reconnects: the blue "re-established" snackbar shows -> quality stays hidden during grace.
			act(() => {
				useStore.getState().setWebsocketStatus(true);
			});
			expect(screen.queryByText(warningLabel)).not.toBeInTheDocument();

			// Grace elapses -> the still-compromised warning comes back.
			act(() => {
				vi.advanceTimersByTime(6000);
			});
			expect(screen.getByText(warningLabel)).toBeInTheDocument();
		} finally {
			vi.useRealTimers();
		}
	});
});
