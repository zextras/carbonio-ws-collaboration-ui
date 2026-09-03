/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useRef, useState } from 'react';

import { Snackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getDownlinkCompromised } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';

// Grace after a websocket reconnect during which the quality snackbars stay hidden, so the blue
// "connection re-established" snackbar (createSnackbar in useGeneralMeetingControls, fired on the
// websocket false->true edge) is shown alone instead of being overlapped.
const RECONNECT_GRACE_MS = 5000;

const DownlinkSnackbarManager = (): ReactElement | null => {
	const [t] = useTranslation();

	const meetingId = useStore(({ activeMeeting }) => activeMeeting?.meetingId);
	const compromised = useStore((store) =>
		meetingId != null ? getDownlinkCompromised(store, meetingId) : false
	);

	// The connection snackbars (amber "network problems" while down, blue "re-established" on
	// recovery) render at the same anchor and describe a more urgent, meeting-wide event, so the
	// quality snackbars yield to them: a full reconnection matters more than a downlink reduction.
	const chatsBeStatus = useStore(({ connections }) => connections.status.chats_be);
	const xmppStatus = useStore(({ connections }) => connections.status.xmpp);
	const websocketStatus = useStore(({ connections }) => connections.status.websocket);
	const connectionDown =
		chatsBeStatus === false || xmppStatus === false || websocketStatus === false;

	const [showGreen, setShowGreen] = useState(false);
	// Local latch so the OK button actually hides the warning: the store keeps `compromised` true while
	// the downlink is still degraded, so without this the snackbar would immediately re-open on the next
	// render. Reset on a fresh degradation edge so a later event shows it again.
	const [dismissed, setDismissed] = useState(false);
	const prevCompromisedRef = useRef(false);

	// Post-reconnect grace: on the websocket false->true edge (what the blue snackbar keys off), keep
	// the quality snackbars suppressed for a short while so the reconnection snackbar shows alone.
	const [reconnectGrace, setReconnectGrace] = useState(false);
	const prevWebsocketRef = useRef(websocketStatus);
	const graceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
	useEffect(() => {
		if (prevWebsocketRef.current === false && websocketStatus === true) {
			setReconnectGrace(true);
			if (graceTimeoutRef.current) clearTimeout(graceTimeoutRef.current);
			graceTimeoutRef.current = setTimeout(() => setReconnectGrace(false), RECONNECT_GRACE_MS);
		}
		prevWebsocketRef.current = websocketStatus;
	}, [websocketStatus]);
	useEffect(
		() => (): void => {
			if (graceTimeoutRef.current) clearTimeout(graceTimeoutRef.current);
		},
		[]
	);

	const suppressed = connectionDown || reconnectGrace;

	useEffect(() => {
		const prev = prevCompromisedRef.current;
		prevCompromisedRef.current = compromised;
		if (prev && !compromised && meetingId != null) {
			setShowGreen(true);
		}
		if (compromised) {
			setShowGreen(false);
		}
		if (!prev && compromised) {
			setDismissed(false);
		}
	}, [compromised, meetingId]);

	// Drop any pending recovery snackbar while a connection snackbar owns the screen, so a stale
	// "recovered" cannot pop after the outage/grace clears.
	useEffect(() => {
		if (suppressed) {
			setShowGreen(false);
		}
	}, [suppressed]);

	return (
		<>
			<Snackbar
				open={compromised && !dismissed && !suppressed}
				severity="warning"
				label={t(
					'meeting.snackbar.downlinkCompromised',
					'Your connection is unstable and video quality is already at the minimum.'
				)}
				disableAutoHide
				actionLabel={t('action.ok', 'Ok')}
				onClose={(): void => setDismissed(true)}
			/>
			<Snackbar
				open={showGreen && !suppressed}
				severity="success"
				label={t('meeting.snackbar.downlinkRestored', 'Your connection has recovered.')}
				autoHideTimeout={4000}
				onClose={(): void => setShowGreen(false)}
			/>
		</>
	);
};

export default DownlinkSnackbarManager;
