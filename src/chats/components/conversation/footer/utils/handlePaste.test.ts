/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { noop } from 'lodash';

import { handleFilesPaste } from './handleFilesPaste';
import { MessageActionType } from '../../../../../types/store/ActiveConversationTypes';

const allBrowsers = {
	isFirefox: (): boolean => true,
	isSafari: (): boolean => true,
	isChrome: (): boolean => true,
	isLinux: (): boolean => true,
	isMac: (): boolean => true,
	isWin: (): boolean => true,
	getChromeVersion: (): number => 100
};

const allBrowsersFalse = {
	isFirefox: (): boolean => false,
	isSafari: (): boolean => false,
	isChrome: (): boolean => false,
	isLinux: (): boolean => false,
	isMac: (): boolean => false,
	isWin: (): boolean => false,
	getChromeVersion: (): number | false => false
};

const linuxBrowser = { ...allBrowsersFalse, isLinux: (): boolean => true };

describe('handlePaste', () => {
	const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
	const filelist = [file] as unknown as FileList;
	const spyLoadFiles = vi.fn();
	beforeEach(() => {
		spyLoadFiles.mockClear();
	});

	test('does not paste if editing', () => {
		const actionType = MessageActionType.EDIT;

		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			actionType,
			loadFiles: spyLoadFiles,
			browserUtils: allBrowsers
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
	});

	test('paste files on reply', () => {
		const actionType = MessageActionType.REPLY;

		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			actionType,
			loadFiles: spyLoadFiles,
			browserUtils: allBrowsers
		});

		expect(spyLoadFiles).toHaveBeenCalled();
	});

	test('calls onFilesPaste', () => {
		const actionType = MessageActionType.REPLY;

		const onFilesPaste = vi.fn();
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste,
			actionType,
			loadFiles: spyLoadFiles,
			browserUtils: allBrowsers
		});

		expect(onFilesPaste).toHaveBeenCalled();
	});

	test('does not paste if no files', () => {
		const actionType = MessageActionType.REPLY;

		handleFilesPaste({
			includeFiles: [] as unknown as FileList,
			onFilesPaste: noop,
			actionType,
			loadFiles: spyLoadFiles,
			browserUtils: allBrowsers
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
	});

	test('paste files on linux', () => {
		const actionType = MessageActionType.REPLY;

		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			actionType,
			loadFiles: spyLoadFiles,
			browserUtils: linuxBrowser
		});

		expect(spyLoadFiles).toHaveBeenCalled();
	});

	test('paste error when windows OS with unknown browser', () => {
		const actionType = MessageActionType.REPLY;

		const browser = { ...allBrowsersFalse, isWin: (): boolean => false };
		const onError = vi.fn();
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			onError,
			actionType,
			loadFiles: spyLoadFiles,
			browserUtils: browser
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalled();
	});
});
