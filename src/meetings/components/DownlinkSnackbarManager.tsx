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
	}, [compromised, meetingId]);

	return (
		<>
			<Snackbar
				open={compromised}
				severity="warning"
				label={t(
					'meeting.snackbar.downlinkCompromised',
					'Your connection is limiting incoming video quality.'
				)}
				disableAutoHide
				onClose={(): void => undefined}
			/>
			<Snackbar
				open={showGreen}
				severity="success"
				label={t('meeting.snackbar.downlinkRestored', 'Incoming video quality has been restored.')}
				autoHideTimeout={4000}
				onClose={(): void => setShowGreen(false)}
			/>
		</>
	);
};

export default DownlinkSnackbarManager;
