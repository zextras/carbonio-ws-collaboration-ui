/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { noop } from 'lodash';

import { handleFilesPaste } from './handleFilesPaste';
import { MessageActionType } from '../../../../../types/store/ActiveConversationTypes';
import { Browser, BrowserDetector, OperatingSystem } from '../../../../../utils/BrowserUtils';

function mockBrowserDetector(
	browserName: Browser['name'],
	operatingSystemName: OperatingSystem['name']
): BrowserDetector {
	return {
		getBrowserType(): Browser {
			return { name: browserName };
		},
		getOperatingSystem(): OperatingSystem {
			return { name: operatingSystemName };
		}
	};
}

type BrowserType = { type: Browser['name']; os: OperatingSystem['name'] };

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
			browserDetector: mockBrowserDetector('Chrome', 'Windows')
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
	});

	test('paste files on reply', () => {
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector('Chrome', 'Windows')
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
			browserDetector: mockBrowserDetector('Chrome', 'Windows')
		});

		expect(onFilesPaste).toHaveBeenCalled();
	});

	test('does not paste if no files', () => {
		handleFilesPaste({
			includeFiles: [] as unknown as FileList,
			onFilesPaste: noop,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector('Chrome', 'Windows')
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
	});

	test('paste files on linux', () => {
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector('Chrome', 'Linux')
		});

		expect(spyLoadFiles).toHaveBeenCalled();
	});

	const unsupportedBrowsers: Array<BrowserType> = [
		{ type: 'Unknown', os: 'Windows' },
		{ type: 'Unknown', os: 'Mac' }
	];
	test.each(unsupportedBrowsers)('unsupported browsers', (browser: BrowserType) => {
		const onError = vi.fn();
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			onError,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector(browser.type, browser.os)
		});

		expect(spyLoadFiles).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalled();
	});

	const supportedBrowsers: Array<BrowserType> = [
		{ type: 'Chrome', os: 'Windows' },
		{ type: 'Firefox', os: 'Windows' },
		{ type: 'Safari', os: 'Windows' },

		{ type: 'Chrome', os: 'Mac' },
		{ type: 'Firefox', os: 'Mac' },
		{ type: 'Safari', os: 'Mac' },

		{ type: 'Chrome', os: 'Linux' },
		{ type: 'Firefox', os: 'Linux' },
		{ type: 'Safari', os: 'Linux' },
		{ type: 'Unknown', os: 'Linux' }
	];
	test.each(supportedBrowsers)('supported browsers', (browser: BrowserType) => {
		const onError = vi.fn();
		handleFilesPaste({
			includeFiles: filelist,
			onFilesPaste: noop,
			onError,
			actionType: MessageActionType.REPLY,
			loadFiles: spyLoadFiles,
			browserDetector: mockBrowserDetector(browser.type, browser.os)
		});

		expect(spyLoadFiles).toHaveBeenCalled();
	});
});
