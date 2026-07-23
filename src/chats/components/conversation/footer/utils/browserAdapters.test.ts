/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { UtilsAdapterBrowserDetector } from './browserAdapters';
import { BrowserUtils } from '../../../../../utils/BrowserUtils';

const fakeBrowserUtils: typeof BrowserUtils = {
	isFirefox: () => false,
	isSafari: () => false,
	isIE: () => false,
	isEdge: () => false,
	isOpera: () => false,
	isChrome: () => false,
	isLinux: () => false,
	isMac: () => false,
	isWin: () => false,
	getChromeVersion: () => false,
	getFirefoxVersion: () => false,
	clearAuthCookies: () => false,
	isMobile: () => false
};

function assertBrowserName(browser: typeof BrowserUtils, browserName: string): void {
	const browserType = new UtilsAdapterBrowserDetector(browser).getBrowserType();

	expect(browserType.name).toEqual(browserName);
}

function assertOperatingSystem(browser: typeof BrowserUtils, os: string): void {
	const operatingSystem = new UtilsAdapterBrowserDetector(browser).getOperatingSystem();

	expect(operatingSystem.name).toEqual(os);
}

describe('BrowserDetector', () => {
	test('detects Firefox', () => {
		const firefox = {
			...fakeBrowserUtils,
			isFirefox: (): boolean => true
		};

		assertBrowserName(firefox, 'Firefox');
	});

	test('detects Chrome', () => {
		const chrome = {
			...fakeBrowserUtils,
			isChrome: (): boolean => true
		};

		assertBrowserName(chrome, 'Chrome');
	});

	test('detects Safari', () => {
		const safari = {
			...fakeBrowserUtils,
			isSafari: (): boolean => true
		};

		assertBrowserName(safari, 'Safari');
	});

	test('detects IE', () => {
		const ie = {
			...fakeBrowserUtils,
			isIE: (): boolean => true
		};

		assertBrowserName(ie, 'IE');
	});

	test('chrome when chrome version defined', () => {
		const browser = {
			...fakeBrowserUtils,
			isChrome: (): boolean => false,
			getChromeVersion: (): number => 100
		};

		assertBrowserName(browser, 'Chrome');
	});

	// Note: see how MessageComposer was used. If BrowserUtils returns chrome version '0', it is falsy.
	// Impossible in real life, but the data type used is not the best.
	test('unknown when chrome version zero', () => {
		const browser = {
			...fakeBrowserUtils,
			isChrome: (): boolean => false,
			getChromeVersion: (): number => 0
		};

		assertBrowserName(browser, 'Unknown');
	});

	test('unknown os when not linux or mac or windows', () => {
		const browser = {
			...fakeBrowserUtils,
			isLinux: (): boolean => false,
			isWindows: (): boolean => false,
			isMac: (): boolean => false
		};

		assertOperatingSystem(browser, 'Unknown');
	});
});
