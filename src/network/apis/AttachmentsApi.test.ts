/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import AttachmentsApi from './AttachmentsApi';
import { AttachmentType, ImageQuality, ImageShape } from '../../types/network/apis/IAttachmentsApi';

const contentType = 'Content-Type';
const applicationJson = 'application/json';

const pdfThumbnailCases: Array<[string, Array<string | undefined>, string]> = [
	['shape', [undefined, ImageShape.ROUNDED, undefined], '?shape=Rounded'],
	['quality', [ImageQuality.HIGH, undefined, undefined], '?quality=High'],
	['attachmentType', [undefined, undefined, AttachmentType.PDF], '?output_format=pdf']
];

const imagePreviewCases: Array<[string, Array<string | undefined>, string]> = [
	['normal', [ImageQuality.LOW, AttachmentType.PNG], '?quality=Low&output_format=Png'],
	['quality', [ImageQuality.HIGH, undefined], '?quality=High'],
	['attachmentType', [undefined, AttachmentType.PNG], '?output_format=Png']
];

const pdfPreviewURLCases: Array<[string, Array<number | undefined>, string]> = [
	['first and last', [1, 10], '?first_page=1&last_page=10'],
	['first only', [2, undefined], '?first_page=2'],
	['last only', [undefined, 5], '?last_page=5']
];

describe('Attachments API', () => {
	test('deleteAttachment is called correctly', async () => {
		// Send deleteAttachment request
		await AttachmentsApi.deleteAttachment('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/attachments/fileId`, {
			headers,
			method: 'DELETE',
			body: undefined
		});
	});

	test('getAttachmentInfo is called correctly', async () => {
		// Send getAttachmentInfo request
		await AttachmentsApi.getAttachmentInfo('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/attachments/fileId`, {
			method: 'GET',
			headers,
			body: undefined
		});
	});

	test('getURLAttachment is called correctly', () => {
		const url = AttachmentsApi.getURLAttachment('fileId');
		expect(url).toEqual(`http://localhost/services/chats/attachments/fileId/download`);
	});

	test('getAttachment is called correctly', async () => {
		// Send getAttachment request
		await AttachmentsApi.getAttachment('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/attachments/fileId/download`, {
			headers,
			method: 'GET',
			body: undefined
		});
	});

	test.each(imagePreviewCases)(
		'getImagePreview with %s only',
		async (type, queryParams, queryRes) => {
			// Send getAttachmentPreview request
			await AttachmentsApi.getImagePreview('fileId', '0x0', ...queryParams);

			// Set appropriate headers
			const headers = new Headers();
			headers.append(contentType, applicationJson);

			// Check if fetch is called with the correct parameters
			expect(global.fetch).toHaveBeenCalledWith(
				`/services/chats/preview/image/fileId/0x0/${queryRes}`,
				{
					headers,
					method: 'GET',
					body: undefined
				}
			);
		}
	);

	test('getImageThumbnail is called correctly', async () => {
		// Send getAttachmentPreview request
		await AttachmentsApi.getImageThumbnail(
			'fileId',
			'0x0',
			ImageQuality.HIGH,
			AttachmentType.JPEG,
			ImageShape.ROUNDED
		);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/preview/image/fileId/0x0/thumbnail/?quality=High&output_format=Jpeg&shape=Rounded`,
			{
				headers,
				method: 'GET',
				body: undefined
			}
		);
	});

	test('getPdfPreview is called correctly', async () => {
		// Send getAttachmentPreview request
		await AttachmentsApi.getPdfPreview('fileId', 1, 4);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/preview/pdf/fileId/?first_page=1&last_page=4`,
			{
				headers,
				method: 'GET',
				body: undefined
			}
		);
	});

	test('getPdfThumbnail is called correctly', async () => {
		// Send getAttachmentPreview request
		await AttachmentsApi.getPdfThumbnail(
			'fileId',
			'0x0',
			ImageQuality.LOWEST,
			ImageShape.RECTANGULAR,
			AttachmentType.PNG
		);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/preview/pdf/fileId/0x0/thumbnail/?shape=Rectangular&quality=Lowest&output_format=Png`,
			{
				headers,
				method: 'GET',
				body: undefined
			}
		);
	});

	test.each(pdfThumbnailCases)(
		'getPdfThumbnail with %s only',
		async (type, queryParams, queryRes) => {
			// Send getAttachmentPreview request
			await AttachmentsApi.getPdfThumbnail('fileId', '0x0', ...queryParams);

			// Set appropriate headers
			const headers = new Headers();
			headers.append(contentType, applicationJson);

			// Check if fetch is called with the correct parameters
			expect(global.fetch).toHaveBeenCalledWith(
				`/services/chats/preview/pdf/fileId/0x0/thumbnail/${queryRes}`,
				{
					headers,
					method: 'GET',
					body: undefined
				}
			);
		}
	);

	test.each(imagePreviewCases)('getImagePreviewURL with %s', (type, queryParams, urlRes) => {
		const url = AttachmentsApi.getImagePreviewURL('fileId', '0x0', ...queryParams);
		expect(url).toEqual(`http://localhost/services/chats/preview/image/fileId/0x0/${urlRes}`);
	});

	test.each(imagePreviewCases)('getImageThumbnailURL with %s', (type, queryParams, urlRes) => {
		const url = AttachmentsApi.getImageThumbnailURL('fileId', '0x0', ...queryParams);
		expect(url).toEqual(
			`http://localhost/services/chats/preview/image/fileId/0x0/thumbnail/${urlRes}`
		);
	});

	test.each(pdfThumbnailCases)('getPdfThumbnailURL with %s', (type, queryParams, urlRes) => {
		const url = AttachmentsApi.getPdfThumbnailURL('fileId', '0x0', ...queryParams);
		expect(url).toEqual(
			`http://localhost/services/chats/preview/pdf/fileId/0x0/thumbnail/${urlRes}`
		);
	});

	test.each(pdfPreviewURLCases)('getPdfPreviewURL with %s', (type, queryParams, urlRes) => {
		const url = AttachmentsApi.getPdfPreviewURL('fileId', ...queryParams);
		expect(url).toEqual(`http://localhost/services/chats/preview/pdf/fileId/${urlRes}`);
	});
});
