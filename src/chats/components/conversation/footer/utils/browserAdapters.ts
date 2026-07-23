/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { BrowserUtils } from '../../../../../utils/BrowserUtils';

export type Browser = {
	name: 'Firefox' | 'Safari' | 'Chrome' | 'IE' | 'Unknown';
};
export type OperatingSystem = {
	name: 'Linux' | 'Mac' | 'Windows' | 'Unknown';
};

export interface BrowserDetector {
	getBrowserType(): Browser;
	getOperatingSystem(): OperatingSystem;
}

export class UtilsAdapterBrowserDetector implements BrowserDetector {
	private readonly browserUtils: typeof BrowserUtils;

	constructor(browserUtils: typeof BrowserUtils) {
		this.browserUtils = browserUtils;
	}

	getBrowserType(): Browser {
		if (this.browserUtils.isSafari()) {
			return { name: 'Safari' };
		}
		if (this.browserUtils.isFirefox()) {
			return { name: 'Firefox' };
		}
		if (this.browserUtils.isChrome()) {
			return { name: 'Chrome' };
		}
		if (this.browserUtils.isIE()) {
			return { name: 'IE' };
		}
		if (this.browserUtils.getChromeVersion()) {
			return { name: 'Chrome' };
		}
		return { name: 'Unknown' };
	}

	getOperatingSystem(): OperatingSystem {
		if (this.browserUtils.isMac()) {
			return { name: 'Mac' };
		}
		if (this.browserUtils.isWin()) {
			return { name: 'Windows' };
		}
		if (this.browserUtils.isLinux()) {
			return { name: 'Linux' };
		}
		return { name: 'Unknown' };
	}
}
