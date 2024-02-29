/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useState } from 'react';

import { Snackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useEventListener, { EventName } from '../../hooks/useEventListener';
import { getWaitingListSizeForMyVirtualMeeting } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';

const WaitingListSnackbar = (): ReactElement | null => {
	const [t] = useTranslation();
	const snackbarLabel = t(
		'meeting.snackbar.waitingInfo',
		'There seems to be someone in the waiting room'
	);

	const waitingListSize = useStore(getWaitingListSizeForMyVirtualMeeting);

	const [showWaitingUserSnackbar, setWaitingUserShowSnackbar] = useState(false);

	useEventListener(EventName.NEW_WAITING_USER, () => setWaitingUserShowSnackbar(true));

	useEffect(() => {
		if (waitingListSize === 0) setWaitingUserShowSnackbar(false);
	}, [waitingListSize]);

	return (
		<Snackbar
			open={showWaitingUserSnackbar}
			key="newWaitingUser"
			type="info"
			label={snackbarLabel}
			disableAutoHide
			onClose={(): void => setWaitingUserShowSnackbar(false)}
		/>
	);
};

export default WaitingListSnackbar;
