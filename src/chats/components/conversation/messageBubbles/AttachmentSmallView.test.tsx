/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import AttachmentSmallView from './AttachmentSmallView';
import * as api from '../../../../network/apis/AttachmentsApi';
import { setup } from '../../../../tests/test-utils';
import { AttachmentMessageType } from '../../../../types/store/ChatsRegistryTypes';

vi.mock('../../../../hooks/usePreviewNavigation', () => ({
	default: (): { openFromGallery: () => void; openFromChat: () => void } => ({
		openFromGallery: vi.fn(),
		openFromChat: vi.fn()
	})
}));

describe('Attachment Small view', () => {
	test('Download generic file', async () => {
		const spyOnGetURLAttachment = vi.spyOn(api, 'getURLAttachment');
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: 'generic.zip',
			mimeType: 'application/zip',
			size: 21412
		};
		const { user } = setup(
			<AttachmentSmallView attachment={genericAttachment} roomId="roomId" messageDate={0} />
		);
		const genericIcon = await screen.findByTestId('icon: FileTextOutline');
		expect(genericIcon).toBeVisible();

		// Hover action is shown
		await user.hover(screen.getByTestId('hover-container'));
		const downloadIcon = screen.getByTestId('icon: DownloadOutline');
		expect(downloadIcon).toBeInTheDocument();

		// Download action is triggered
		await user.click(downloadIcon);
		expect(spyOnGetURLAttachment).toHaveBeenCalledTimes(1);
	});

	test('Preview image file', async () => {
		const spyOnGetImageThumbnailURL = vi.spyOn(api, 'getImageThumbnailURL');
		const imageAttachment: AttachmentMessageType = {
			id: 'pngAttachmentId',
			name: 'image.png',
			mimeType: 'image/png',
			size: 21412
		};
		const { user } = setup(
			<AttachmentSmallView attachment={imageAttachment} roomId="roomId" messageDate={0} />
		);

		// Hover action is shown
		await user.hover(screen.getByTestId('hover-container'));
		const previewIcon = screen.getByTestId('icon: EyeOutline');
		expect(previewIcon).toBeInTheDocument();

		// preview action is triggered
		await user.click(previewIcon);
		expect(spyOnGetImageThumbnailURL).toHaveBeenCalled();
	});

	test('Display correct icon for Word document', () => {
		const docxAttachment: AttachmentMessageType = {
			id: 'docxAttachmentId',
			name: 'document.docx',
			mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			size: 21412
		};
		setup(<AttachmentSmallView attachment={docxAttachment} roomId="roomId" messageDate={0} />);
		const docIcon = screen.getByTestId('icon: FileTextOutline');
		expect(docIcon).toBeVisible();
	});

	test('Display correct icon for Excel spreadsheet', () => {
		const xlsxAttachment: AttachmentMessageType = {
			id: 'xlsxAttachmentId',
			name: 'spreadsheet.xlsx',
			mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			size: 21412
		};
		setup(<AttachmentSmallView attachment={xlsxAttachment} roomId="roomId" messageDate={0} />);
		const xlsIcon = screen.getByTestId('icon: FileCalcOutline');
		expect(xlsIcon).toBeVisible();
	});

	test('Display correct icon for PowerPoint presentation', () => {
		const pptxAttachment: AttachmentMessageType = {
			id: 'pptxAttachmentId',
			name: 'presentation.pptx',
			mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			size: 21412
		};
		setup(<AttachmentSmallView attachment={pptxAttachment} roomId="roomId" messageDate={0} />);
		const pptIcon = screen.getByTestId('icon: FilePresentationOutline');
		expect(pptIcon).toBeVisible();
	});

	test('Avatar shows thumbnail for image attachments', () => {
		const spyOnGetImageThumbnailURL = vi.spyOn(api, 'getImageThumbnailURL');
		const imageAttachment: AttachmentMessageType = {
			id: 'thumbnailImageId',
			name: 'photo.png',
			mimeType: 'image/png',
			size: 21412
		};
		setup(<AttachmentSmallView attachment={imageAttachment} roomId="roomId" messageDate={0} />);
		expect(spyOnGetImageThumbnailURL).toHaveBeenCalledWith(
			imageAttachment.id,
			'0x0',
			'Low',
			'png',
			'Rectangular'
		);
	});
});
