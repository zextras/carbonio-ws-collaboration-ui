/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect } from 'react';

import useRouting from '../hooks/useRouting';

const AccessMeetingPageView = (): ReactElement => {
	const { goToMeetingPage } = useRouting();
	useEffect(() => {
		setTimeout(() => {
			goToMeetingPage('123456');
		}, 5000);
	}, [goToMeetingPage]);

	return <div>Access meeting page</div>;
};

export default AccessMeetingPageView;
