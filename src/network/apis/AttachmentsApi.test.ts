/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import attachmentsApi from './AttachmentsApi';

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

	test('getURLPreview is called correctly', () => {
		const url = attachmentsApi.getURLPreview('fileId');
		expect(url).toEqual(`http://localhost/services/chats/attachments/fileId/preview`);
	});

	test('getAttachmentPreview is called correctly', async () => {
		// Send getAttachmentPreview request
		await attachmentsApi.getAttachmentPreview('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/attachments/fileId/preview`, {
			headers,
			method: 'GET',
			body: undefined
		});
	});
});
