/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';
import { filter } from 'lodash';

import AttachmentView from './AttachmentView';
import * as api from '../../../../network/apis/AttachmentsApi';
import { setup } from '../../../../tests/test-utils';
import { AttachmentMessageType } from '../../../../types/store/ChatsRegistryTypes';
import { extensionsSupported, getAttachmentThumbnailURL } from '../../../../utils/attachmentUtils';

const fileIcon = 'icon: FileTextOutline';

describe('Attachment view', () => {
	test('Generic file visualization', async () => {
		const spyOnGetURLAttachment = vi.spyOn(api, 'getURLAttachment');
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: 'generic.zip',
			mimeType: 'application/zip',
			size: 21412
		};
		const { user } = setup(
			<AttachmentView
				attachment={genericAttachment}
				from={'from'}
				roomId="roomId"
				messageDate={0}
			/>
		);
		const genericIcon = await screen.findByTestId(fileIcon);
		expect(genericIcon).toBeVisible();
		const fileName = await screen.findByText(genericAttachment.name);
		expect(fileName).toBeVisible();

		// Hover action is shown
		await user.hover(screen.getByTestId('hover-container'));
		const downloadIcon = screen.getByTestId('icon: DownloadOutline');
		expect(downloadIcon).toBeInTheDocument();
		await user.click(downloadIcon);
		expect(spyOnGetURLAttachment).toHaveBeenCalled();
	});

	test('file with long mimeType visualization', () => {
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: 'generic.docx',
			mimeType: 'application/openxmlformats-officedocument.wordprocessingml.document',
			size: 21412
		};
		setup(
			<AttachmentView
				attachment={genericAttachment}
				from={'from'}
				roomId="roomId"
				messageDate={0}
			/>
		);
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
		setup(
			<AttachmentView attachment={imageAttachment} from={'from'} roomId="roomId" messageDate={0} />
		);
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
		const { user } = setup(
			<AttachmentView attachment={imageAttachment} from={'from'} roomId="roomId" messageDate={0} />
		);
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
		setup(
			<AttachmentView attachment={imageAttachment} from={'from'} roomId="roomId" messageDate={0} />
		);
		const img = screen.getByTestId('attachmentImg');
		fireEvent.error(img);
		const imageName = await screen.findByText(imageAttachment.name);
		expect(imageName).toBeVisible();
		const genericIcon = await screen.findByTestId('icon: Image');
		expect(genericIcon).toBeVisible();
	});

	test.each(extensionsSupported)('Display %s extension', ({ extension, mimeType }) => {
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: `generic.${extension}`,
			mimeType,
			size: 21412
		};
		setup(
			<AttachmentView
				attachment={genericAttachment}
				from={'from'}
				roomId="roomId"
				messageDate={0}
			/>
		);
		const fileName = screen.getByText(genericAttachment.name);
		expect(fileName).toBeVisible();
		const match = new RegExp(`${extension}`, 'i');
		const extensionLabel = screen.getByText(match);
		expect(extensionLabel).toBeInTheDocument();
	});

	const previewExtensionsSupported = filter(
		extensionsSupported,
		(ext) => getAttachmentThumbnailURL('id', ext.mimeType) !== undefined
	);
	test.each(previewExtensionsSupported)('Display %s preview', ({ extension, mimeType }) => {
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: `generic.${extension}`,
			mimeType,
			size: 21412
		};
		setup(
			<AttachmentView
				attachment={genericAttachment}
				from={'from'}
				roomId="roomId"
				messageDate={0}
			/>
		);
		const previewContainer = screen.getByTestId('preview-container');

		expect(previewContainer).toBeVisible();
	});
});
