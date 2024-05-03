/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { isEnabled, enable, disable } from 'darkreader';
import { find } from 'lodash';

import { MEETINGS_PATH } from '../constants/appConstants';

type DarkReaderModeType = 'enabled' | 'disabled' | 'auto';

type UseDarkReaderReturnType = {
	darkReaderStatus: boolean;
	darkReaderMode?: DarkReaderModeType;
	enableDarkReader: () => void;
	disableDarkReader: () => void;
};

const useDarkReader = (): UseDarkReaderReturnType => {
	const settings = useUserSettings();

	const inMeetingTab = useMemo(() => window.location.pathname.includes(MEETINGS_PATH), []);

	const darkReaderMode = useMemo(() => {
		if (inMeetingTab) {
			return 'enabled';
		}
		const mode = find(settings.props, (value) => value.name === 'zappDarkreaderMode')
			?._content as DarkReaderModeType;
		return mode || 'disabled';
	}, [inMeetingTab, settings.props]);

	const enableDarkReader = useCallback(() => {
		enable(
			{
				sepia: 0
			},
			{
				ignoreImageAnalysis: ['.no-dr-invert *'],
				invert: [],
				css: `
					.tox, .force-white-bg, .tox-swatches-menu, .tox .tox-edit-area__iframe {
						background-color: #fff !important;
						background: #fff !important;
					}
				`,
				ignoreInlineStyle: ['.tox-menu *'],
				disableStyleSheetsProxy: false
			}
		);
	}, []);

	return {
		darkReaderStatus: isEnabled(),
		darkReaderMode,
		enableDarkReader,
		disableDarkReader: disable
	};
};

export default useDarkReader;
