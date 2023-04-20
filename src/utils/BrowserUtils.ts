/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const BrowserUtils = {
	isFirefox: (): boolean => navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
	isSafari: (): boolean =>
		/constructor/i.test((window as any).HTMLElement) ||
		((p): boolean => p.toString() === '[object SafariRemoteNotification]')(
			!(window as any).safari ||
				(typeof (window as any).safari !== 'undefined' && (window as any).safari.pushNotification)
		),
	isIE: (): boolean => !!(document as any).documentMode,
	isEdge: (): boolean => !BrowserUtils.isIE() && !!(window as any).StyleMedia,
	isOpera: (): boolean =>
		(!!(window as any).opr && !!(window as any).opr.addons) ||
		!!(window as any).opera ||
		navigator.userAgent.indexOf(' OPR/') >= 0,
	isChrome: (): boolean =>
		!!(window.parent as any).chrome &&
		(!!(window.parent as any).chrome.webstore || !!(window.parent as any).chrome.runtime),
	isLinux: (): boolean => navigator.platform.indexOf('Linux') !== -1,
	isMac: (): boolean => navigator.platform.indexOf('Mac') !== -1,
	isWin: (): boolean => navigator.platform.indexOf('Win') !== -1,
	getChromeVersion: (): number | false => {
		const match = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
		return match ? parseInt(match[2], 10) : false;
	},
	getFirefoxVersion: (): number | false => {
		const match = navigator.userAgent.match(/Firefox\/([0-9]+)\./);
		return match ? parseInt(match[1], 10) : 0;
	}
};
