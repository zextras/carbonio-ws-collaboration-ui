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

const DownlinkSnackbarManager = (): ReactElement | null => {
	const [t] = useTranslation();

	const meetingId = useStore(({ activeMeeting }) => activeMeeting?.meetingId);
	const compromised = useStore((store) =>
		meetingId != null ? getDownlinkCompromised(store, meetingId) : false
	);

	const [showGreen, setShowGreen] = useState(false);
	// Local latch so the OK button actually hides the warning: the store keeps `compromised` true while
	// the downlink is still degraded, so without this the snackbar would immediately re-open on the next
	// render. Reset on a fresh degradation edge so a later event shows it again.
	const [dismissed, setDismissed] = useState(false);
	const prevCompromisedRef = useRef(false);

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

	return (
		<>
			<Snackbar
				open={compromised && !dismissed}
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
				open={showGreen}
				severity="success"
				label={t('meeting.snackbar.downlinkRestored', 'Your connection has recovered.')}
				autoHideTimeout={4000}
				onClose={(): void => setShowGreen(false)}
			/>
		</>
	);
};

export default DownlinkSnackbarManager;
