/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import attachmentsApi from './AttachmentsApi';
import { ImageQuality, ImageShape, ImageType } from '../../types/network/apis/IAttachmentsApi';

describe('Attachments API', () => {
	test('deleteAttachment is called correctly', async () => {
		// Send deleteAttachment request
		await attachmentsApi.deleteAttachment('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/attachments/fileId`, {
			headers,
			method: 'DELETE',
			body: undefined
		});
	});

	test('getAttachmentInfo is called correctly', async () => {
		// Send getAttachmentInfo request
		await attachmentsApi.getAttachmentInfo('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/attachments/fileId`, {
			method: 'GET',
			headers,
			body: undefined
		});
	});

	test('getURLAttachment is called correctly', () => {
		const url = attachmentsApi.getURLAttachment('fileId');
		expect(url).toEqual(`http://localhost/services/chats/attachments/fileId/download`);
	});

	test('getAttachment is called correctly', async () => {
		// Send getAttachment request
		await attachmentsApi.getAttachment('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/attachments/fileId/download`, {
			headers,
			method: 'GET',
			body: undefined
		});
	});

	test('getImagePreview is called correctly', async () => {
		// Send getAttachmentPreview request
		await attachmentsApi.getImagePreview('fileId', '0x0', ImageQuality.LOW, ImageType.PNG);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/preview/image/fileId/0x0/?quality=Low&output_format=Png`,
			{
				headers,
				method: 'GET',
				body: undefined
			}
		);
	});

	test('getImageThumbnail is called correctly', async () => {
		// Send getAttachmentPreview request
		await attachmentsApi.getImageThumbnail(
			'fileId',
			'0x0',
			ImageQuality.HIGH,
			ImageType.JPEG,
			ImageShape.ROUNDED
		);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

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
		await attachmentsApi.getPdfPreview('fileId', 1, 4);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

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
		await attachmentsApi.getPdfThumbnail(
			'fileId',
			'0x0',
			ImageQuality.LOWEST,
			ImageShape.RECTANGULAR,
			ImageType.PNG
		);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

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
});
