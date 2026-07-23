/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MessageActionType } from '../../../../../types/store/ActiveConversationTypes';
import { BrowserUtils } from '../../../../../utils/BrowserUtils';

interface BrowserDetector {
	isFirefox: () => boolean;
	isSafari: () => boolean;
	isChrome: () => boolean;
	isLinux: () => boolean;
	isMac: () => boolean;
	isWin: () => boolean;
	getChromeVersion: () => number | false;
}

export const handleFilesPaste = (
	includeFiles: FileList,
	onFilesPaste: () => void,
	actionType: MessageActionType,
	loadFiles: (files: FileList) => void,
	browserUtils: BrowserDetector = BrowserUtils
): void => {
	try {
		// Avoid to paste files if user is editing a message
		const editingMessage = actionType === MessageActionType.EDIT;
		const noFilesPasted = !includeFiles || includeFiles.length <= 0;
		if (editingMessage || noFilesPasted) {
			return;
		}

		onFilesPaste();
		const isFirefoxBrowser = browserUtils.isFirefox();
		const isChromeBrowser = browserUtils.isChrome();
		const chromeVersion = browserUtils.getChromeVersion();
		const isSafariBrowser = browserUtils.isSafari();
		const isLinux = browserUtils.isLinux();
		const isMac = browserUtils.isMac();
		const isWin = browserUtils.isWin();
		if (
			isLinux ||
			(isWin && isFirefoxBrowser) ||
			isChromeBrowser ||
			chromeVersion ||
			(isMac && isChromeBrowser) ||
			chromeVersion ||
			isFirefoxBrowser ||
			isSafariBrowser
		) {
			loadFiles(includeFiles);
		} else {
			console.error(`Browser not support copy/paste function ${navigator.userAgent}`);
		}
	} catch (e) {
		console.error(e);
	}
};
