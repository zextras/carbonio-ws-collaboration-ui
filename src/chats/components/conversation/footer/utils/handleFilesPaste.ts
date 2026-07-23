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

export const handleFilesPaste = ({
	includeFiles,
	onFilesPaste,
	actionType,
	loadFiles,
	onError,
	browserUtils = BrowserUtils
}: {
	includeFiles: FileList;
	onFilesPaste: () => void;
	actionType: MessageActionType;
	loadFiles: (files: FileList) => void;
	onError?: (error: Error | unknown) => void;
	browserUtils: BrowserDetector;
}): void => {
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
			onError?.(new Error(`Browser not support copy/paste function ${navigator.userAgent}`));
		}
	} catch (e) {
		onError?.(e);
	}
};
