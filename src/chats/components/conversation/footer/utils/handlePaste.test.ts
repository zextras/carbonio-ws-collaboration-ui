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

describe('handlePaste', () => {
	const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
	const filelist = [file] as unknown as FileList;
	const spyLoadFiles = vi.fn();
	beforeEach(() => {
		spyLoadFiles.mockClear();
	});

	test('does not paste if editing', () => {
		const actionType = MessageActionType.EDIT;

		handleFilesPaste(filelist, noop, actionType, spyLoadFiles, allBrowsers);

		expect(spyLoadFiles).not.toHaveBeenCalled();
	});

	test('paste files on reply', () => {
		const actionType = MessageActionType.REPLY;

		handleFilesPaste(filelist, noop, actionType, spyLoadFiles, allBrowsers);

		expect(spyLoadFiles).toHaveBeenCalled();
	});

	test('does not paste if no files', () => {
		const actionType = MessageActionType.REPLY;

		handleFilesPaste([] as unknown as FileList, noop, actionType, spyLoadFiles, allBrowsers);

		expect(spyLoadFiles).not.toHaveBeenCalled();
	});
});
