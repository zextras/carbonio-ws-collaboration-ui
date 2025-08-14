/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import { IS_FOCUS_MODE } from '@zextras/carbonio-shell-ui';

import { MEETINGS_PATH } from './constants/appConstants';
import LicensedApp from './LicensedApp';
import { InfoApi } from './network';

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

	useEffect(() => {
		InfoApi.getLicense()
			.then((response) => {
				setIsLicensed(response.licensed);
			})
			.catch(() => {
				// Display app to avoid blocking it on CarbonioCE
				setIsLicensed(true);
			});
	}, []);

	if (isLicensed === null) {
		return null;
	}

	return isLicensed ? <LicensedApp /> : <UnlicensedApp />;
}
