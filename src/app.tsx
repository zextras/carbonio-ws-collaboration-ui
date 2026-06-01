/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import { IS_FOCUS_MODE, useIsCarbonioCE } from '@zextras/carbonio-shell-ui';

import { MEETINGS_PATH } from './constants/appConstants';
import { sendCustomEvent } from './hooks/useEventListener';
import MainApp from './MainApp';
import displayWaitingListNotification from './meetings/components/sidebar/waitingListAccordion/displayWaitingListNotification';
import HistoryAccumulator from './network/xmpp/utility/HistoryAccumulator';
import { xmppClient } from './network/xmpp/XMPPClient';
import useStore from './store/Store';
import { BrowserUtils } from './utils/BrowserUtils';
import { fetchAPI, sendFileFetchAPI, uploadFileFetchAPI } from './utils/FetchUtils';
import { sendAudioFeedback } from './utils/MeetingsUtils';
import * as UserMediaManager from './utils/UserMediaManager';
import { configureSharedCode, getLicense } from 'wsc-shared';

configureSharedCode({
	useStore,
	sendCustomEvent,
	fetchAPI,
	sendFileFetchAPI,
	uploadFileFetchAPI,
	BrowserUtils,
	xmppClient,
	HistoryAccumulator,
	sendAudioFeedback,
	displayWaitingListNotification,
	UserMediaManager
});

const UnlicensedApp = (): null => {
	useEffect(() => {
		if (IS_FOCUS_MODE && window.location.pathname.includes(MEETINGS_PATH)) {
			window.location.assign(`${window.location.origin}/static/login`);
		}
	}, []);
	return null;
};

export default function App(): React.JSX.Element | null {
	const [isLicensed, setIsLicensed] = useState<boolean | null>(null);

	const isCarbonioCE = useIsCarbonioCE();

	useEffect(() => {
		if (!isCarbonioCE) {
			getLicense()
				.then((response) => {
					setIsLicensed(response.licensed);
				})
				.catch(() => {
					setIsLicensed(true);
				});
		}
	}, [isCarbonioCE]);

	if (!isCarbonioCE && isLicensed === null) {
		return null;
	}

	return isCarbonioCE || isLicensed ? <MainApp /> : <UnlicensedApp />;
}
