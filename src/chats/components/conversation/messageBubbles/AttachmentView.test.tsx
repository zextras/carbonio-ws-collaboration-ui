/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import AttachmentView from './AttachmentView';
import {
	mockedGetImageThumbnailURL,
	mockedGetURLAttachment
} from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { AttachmentType } from '../../../../types/network/apis/IAttachmentsApi';
import { AttachmentMessageType } from '../../../../types/store/MessageTypes';

const attachmentCases = [
	[AttachmentType.GIF, 'image', AttachmentType.GIF],
	[AttachmentType.PNG, 'image', AttachmentType.PNG],
	[AttachmentType.JPEG, 'image', AttachmentType.JPEG],
	[AttachmentType.WEBP, 'image', AttachmentType.WEBP],
	[AttachmentType.PDF, 'application', AttachmentType.PDF],
	[
		AttachmentType.DOCX,
		'application',
		'vnd.openxmlformats-officedocument.wordprocessingml.document'
	],
	[
		AttachmentType.PPTX,
		'application',
		'vnd.openxmlformats-officedocument.presentationml.presentation'
	],
	[AttachmentType.XLSX, 'application', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
	[AttachmentType.ODP, 'application', 'vnd.oasis.opendocument.presentation'],
	[AttachmentType.ODS, 'application', 'vnd.oasis.opendocument.spreadsheet'],
	[AttachmentType.ODT, 'application', 'vnd.oasis.opendocument.text'],
	[AttachmentType.MPKG, 'application', 'vnd.apple.installer+xml'],
	[AttachmentType.PPT, 'application', 'vnd.ms-powerpoint'],
	[AttachmentType.XLS, 'application', 'vnd.ms-excel']
];

const fileIcon = 'icon: FileTextOutline';

describe('Attachment view', () => {
	test('Generic file visualization', async () => {
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: 'generic.zip',
			mimeType: 'application/zip',
			size: 21412
		};
		const { user } = setup(<AttachmentView attachment={genericAttachment} from={'from'} />);
		const genericIcon = await screen.findByTestId(fileIcon);
		expect(genericIcon).toBeVisible();
		const fileName = await screen.findByText(genericAttachment.name);
		expect(fileName).toBeVisible();

		// Download is triggered
		mockedGetURLAttachment.mockReturnValue('image.jpg');
		// Hover action is shown
		await user.hover(screen.getByTestId('hover-container'));
		const downloadIcon = screen.getByTestId('icon: DownloadOutline');
		expect(downloadIcon).toBeInTheDocument();
		await user.click(downloadIcon);
		expect(mockedGetURLAttachment).toHaveBeenCalled();
	});

	test('file with long mimeType visualization', () => {
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: 'generic.docx',
			mimeType: 'application/openxmlformats-officedocument.wordprocessingml.document',
			size: 21412
		};
		setup(<AttachmentView attachment={genericAttachment} from={'from'} />);
		const genericIcon = screen.getByTestId(fileIcon);
		expect(genericIcon).toBeVisible();
		const fileName = screen.getByText(genericAttachment.name);
		expect(fileName).toBeVisible();
		const extension = screen.getByText(/DOCX/i);
		expect(extension).toBeInTheDocument();
	});

	test('attachment visualization with preview', async () => {
		const imageAttachment: AttachmentMessageType = {
			id: 'pngAttachmentId',
			name: 'image.png',
			mimeType: 'image/png',
			size: 21412,
			area: '0x0'
		};
		mockedGetImageThumbnailURL.mockReturnValue('mocked-url');
		setup(<AttachmentView attachment={imageAttachment} from={'from'} />);
		const imageName = await screen.findByText(imageAttachment.name);
		expect(imageName).toBeVisible();
	});

	test('Hover on attachment visualization', async () => {
		const area = '0x0';
		const imageAttachment: AttachmentMessageType = {
			id: 'pngAttachmentId',
			name: 'image.png',
			mimeType: 'image/png',
			size: 21412,
			area
		};
		mockedGetImageThumbnailURL.mockReturnValue('mocked-url');
		const { user } = setup(<AttachmentView attachment={imageAttachment} from={'from'} />);
		await user.hover(screen.getByTestId('preview-container'));
		expect(screen.getByTestId('icon: EyeOutline')).toBeInTheDocument();
		expect(screen.getByTestId('icon: DownloadOutline')).toBeInTheDocument();
	});

	test('Image visualization with error on preview', async () => {
		const area = '0x0';
		const imageAttachment: AttachmentMessageType = {
			id: 'pngAttachmentId',
			name: 'image.png',
			mimeType: 'image/png',
			size: 21412,
			area
		};
		mockedGetImageThumbnailURL.mockReturnValue('image.jpg');
		setup(<AttachmentView attachment={imageAttachment} from={'from'} />);
		const img = screen.getByTestId('attachmentImg');
		fireEvent.error(img);
		const imageName = await screen.findByText(imageAttachment.name);
		expect(imageName).toBeVisible();
		const genericIcon = await screen.findByTestId('icon: Image');
		expect(genericIcon).toBeVisible();
	});

	test.each(attachmentCases)('display %s extension', (ext, type, mimetype) => {
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: `generic.${ext}`,
			mimeType: `${type}/${mimetype}`,
			size: 21412
		};
		setup(<AttachmentView attachment={genericAttachment} from={'from'} />);
		const genericIcon = screen.getByTestId(fileIcon);
		expect(genericIcon).toBeVisible();
		const fileName = screen.getByText(genericAttachment.name);
		expect(fileName).toBeVisible();
		const match = new RegExp(`${ext}`, 'i');

		const extension = screen.getByText(match);
		expect(extension).toBeInTheDocument();
	});
});
