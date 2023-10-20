/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useState } from 'react';

import * as darkreader from 'darkreader';

export const useDarkReaderStatus = (): boolean => {
	const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);

	useEffect(() => {
		setIsDarkModeEnabled(darkreader.isEnabled());
	}, []);

	return isDarkModeEnabled;
};

export default useDarkReaderStatus;
