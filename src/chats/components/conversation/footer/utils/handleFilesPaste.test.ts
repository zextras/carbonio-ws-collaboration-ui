/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {noop} from 'lodash';

import {handleFilesPaste} from './handleFilesPaste';
import {MessageActionType} from '../../../../../types/store/ActiveConversationTypes';
import {Browser, BrowserDetector, OperatingSystem} from "../../../../../utils/BrowserUtils";

function mockBrowserDetector(browserName: Browser['name'], operatingSystemName: OperatingSystem['name']) {
	const windowsUnknownBrowser: BrowserDetector = {
		getBrowserType(): Browser {
			return {name: browserName};
		}, getOperatingSystem(): OperatingSystem {
			return {name: operatingSystemName};
		}
	}
	return windowsUnknownBrowser;
}

describe('handlePaste', () => {
	const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
	const filelist = [file] as unknown as FileList;
	const spyLoadFiles = vi.fn();
	beforeEach(() => {
		spyLoadFiles.mockClear();
	});

	test('does not paste if editing', () => {
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			actionType: MessageActionType.EDIT,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector("Chrome", "Windows")
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
	});

	test('paste files on reply', () => {
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector("Chrome", "Windows")
		});

		expect(spyLoadFiles).toHaveBeenCalled();
	});

	test('calls onFilesPaste', () => {
		const onFilesPaste = vi.fn();
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector("Chrome", "Windows")
		});

		expect(onFilesPaste).toHaveBeenCalled();
	});

	test('does not paste if no files', () => {
		handleFilesPaste({
			includeFiles: [] as unknown as FileList,
			onFilesPaste: noop,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector("Chrome", "Windows")
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
	});

	test('paste files on linux', () => {
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector("Chrome", "Linux")
		});

		expect(spyLoadFiles).toHaveBeenCalled();
	});

	test('paste error when windows OS with unknown browser', () => {
		const onError = vi.fn();
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			onError,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector("Unknown", "Windows")
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalled();
	});
});
