/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { BrowserDetector } from './browserAdapters';
import { MessageActionType } from '../../../../../types/store/ActiveConversationTypes';

export const handleFilesPaste = ({
	includeFiles,
	onFilesPaste,
	actionType,
	loadFiles,
	onError,
	browserDetector
}: {
	includeFiles: FileList;
	onFilesPaste: () => void;
	actionType: MessageActionType;
	loadFiles: (files: FileList) => void;
	onError?: (error: Error | unknown) => void;
	browserDetector: BrowserDetector;
}): void => {
	try {
		// Avoid to paste files if user is editing a message
		const editingMessage = actionType === MessageActionType.EDIT;
		const noFilesPasted = !includeFiles || includeFiles.length <= 0;
		if (editingMessage || noFilesPasted) {
			return;
		}

		onFilesPaste();
		const browserName = browserDetector.getBrowserType().name;
		const isFirefoxBrowser = browserName === 'Firefox';
		const isChromeBrowser = browserName === 'Chrome';
		const isSafariBrowser = browserName === 'Safari';

		const operatingSystemName = browserDetector.getOperatingSystem().name;
		const isLinux = operatingSystemName === 'Linux';
		const isMac = operatingSystemName === 'Mac';
		const isWin = operatingSystemName === 'Windows';

		if (
			isLinux ||
			(isWin && isFirefoxBrowser) ||
			isChromeBrowser ||
			(isMac && isChromeBrowser) ||
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
