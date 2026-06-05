/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import { IS_FOCUS_MODE, useIsCarbonioCE } from '@zextras/carbonio-shell-ui';

import { sendCustomEvent } from './hooks/useEventListener';
import MainApp from './MainApp';
import { xmppClient } from './network/xmpp';
import { displayNotification } from './notification';
import useStore from './store/Store';
import { playAudio } from './utils/AudioUtils';
import { BrowserUtils } from './utils/BrowserUtils';
import { fetchAPI, sendFileFetchAPI, uploadFileFetchAPI } from './utils/FetchUtils';
import {
	createSilentAudioStream,
	getStream,
	playRemoteAudioStream
} from './utils/UserMediaManager';
import { configureSharedCode, getLicense, MEETINGS_PATH } from 'wsc-shared';

configureSharedCode({
	useStore,
	sendCustomEvent,
	playAudio,
	getStream,
	createSilentAudioStream,
	playRemoteAudioStream,
	clearAuthCookies: BrowserUtils.clearAuthCookies,
	xmppClient,
	fetchAPI,
	sendFileFetchAPI,
	uploadFileFetchAPI,
	displayNotification
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
