/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as api from './AttachmentsApi';
import { mockFetchAPI } from '../../utils/__mocks__/FetchUtils';
import { AttachmentType, ImageQuality, ImageShape } from '../../utils/attachmentUtils';
import { RequestType } from '../../utils/FetchUtils';

const contentType = 'Content-Type';
const applicationJson = 'application/json';

const pdfThumbnailCases: Array<[string, Array<string | undefined>, string]> = [
	['shape', [undefined, ImageShape.ROUNDED, undefined], '?shape=Rounded&output_format=jpeg'],
	['quality', [ImageQuality.HIGH, undefined, undefined], '?quality=High&output_format=jpeg'],
	['attachmentType', [undefined, undefined, AttachmentType.PDF], '?output_format=pdf']
];

const imagePreviewCases: Array<[string, Array<string | undefined>, string]> = [
	['normal', [ImageQuality.LOW, AttachmentType.PNG], '?quality=Low&output_format=png'],
	['quality', [ImageQuality.HIGH, undefined], '?quality=High'],
	['attachmentType', [undefined, AttachmentType.PNG], '?output_format=png']
];

const pdfPreviewURLCases: Array<[string, Array<number | undefined>, string]> = [
	['first and last', [1, 10], '?first_page=1&last_page=10'],
	['first only', [2, undefined], '?first_page=2'],
	['last only', [undefined, 5], '?last_page=5']
];

vi.mock('../../utils/FetchUtils');

describe('Attachments API', () => {
	test('deleteAttachment is called correctly', async () => {
		// Send deleteAttachment request
		await api.deleteAttachment('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(mockFetchAPI).toHaveBeenCalledWith('attachments/fileId', RequestType.DELETE);
	});

	test('getAttachmentInfo is called correctly', async () => {
		// Send getAttachmentInfo request
		await api.getAttachmentInfo('fileId');

		expect(mockFetchAPI).toHaveBeenCalledWith('attachments/fileId', RequestType.GET);
	});

	test('getURLAttachment is called correctly', () => {
		const url = api.getURLAttachment('fileId');

		expect(url).toEqual('http://localhost/services/chats/attachments/fileId/download');
	});

	test('getAttachment is called correctly', async () => {
		// Send getAttachment request
		await api.getAttachment('fileId');

		expect(mockFetchAPI).toHaveBeenCalledWith('attachments/fileId/download', RequestType.GET);
	});

	test.each(imagePreviewCases)(
		'getImagePreview with %s only',
		async (type, queryParams, queryRes) => {
			// Send getAttachmentPreview request
			await api.getImagePreview('fileId', '0x0', ...queryParams);

			// Set appropriate headers
			const headers = new Headers();
			headers.append(contentType, applicationJson);

			expect(mockFetchAPI).toHaveBeenCalledWith(
				`preview/image/fileId/0x0/${queryRes}`,
				RequestType.GET
			);
		}
	);

	test('getImageThumbnail is called correctly', async () => {
		// Send getAttachmentPreview request
		await api.getImageThumbnail(
			'fileId',
			'0x0',
			ImageQuality.HIGH,
			AttachmentType.JPEG,
			ImageShape.ROUNDED
		);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			'preview/image/fileId/0x0/thumbnail/?quality=High&output_format=jpeg&shape=Rounded',
			RequestType.GET
		);
	});

	test('getPdfPreview is called correctly', async () => {
		// Send getAttachmentPreview request
		await api.getPdfPreview('fileId', 1, 4);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			'preview/pdf/fileId/?first_page=1&last_page=4',
			RequestType.GET
		);
	});

	test('getPdfThumbnail is called correctly', async () => {
		// Send getAttachmentPreview request
		await api.getPdfThumbnail(
			'fileId',
			'0x0',
			ImageQuality.LOWEST,
			ImageShape.RECTANGULAR,
			AttachmentType.PNG
		);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			'preview/pdf/fileId/0x0/thumbnail/?shape=Rectangular&quality=Lowest&output_format=png',
			RequestType.GET
		);
	});

	test.each(pdfThumbnailCases)(
		'getPdfThumbnail with %s only',
		async (type, queryParams, queryRes) => {
			// Send getAttachmentPreview request
			await api.getPdfThumbnail('fileId', '0x0', ...queryParams);

			expect(mockFetchAPI).toHaveBeenCalledWith(
				`preview/pdf/fileId/0x0/thumbnail/${queryRes}`,
				RequestType.GET
			);
		}
	);

	test.each(imagePreviewCases)('getImagePreviewURL with %s', (type, queryParams, urlRes) => {
		const url = api.getImagePreviewURL('fileId', '0x0', ...queryParams);

		expect(url).toEqual(`http://localhost/services/chats/preview/image/fileId/0x0/${urlRes}`);
	});

	test.each(imagePreviewCases)('getImageThumbnailURL with %s', (type, queryParams, urlRes) => {
		const url = api.getImageThumbnailURL('fileId', '0x0', ...queryParams);

		expect(url).toEqual(
			`http://localhost/services/chats/preview/image/fileId/0x0/thumbnail/${urlRes}`
		);
	});

	test.each(pdfThumbnailCases)('getPdfThumbnailURL with %s', (type, queryParams, urlRes) => {
		const url = api.getPdfThumbnailURL('fileId', '0x0', ...queryParams);

		expect(url).toEqual(
			`http://localhost/services/chats/preview/pdf/fileId/0x0/thumbnail/${urlRes}`
		);
	});

	test.each(pdfPreviewURLCases)('getPdfPreviewURL with %s', (type, queryParams, urlRes) => {
		const url = api.getPdfPreviewURL('fileId', ...queryParams);

		expect(url).toEqual(`http://localhost/services/chats/preview/pdf/fileId/${urlRes}`);
	});
});
