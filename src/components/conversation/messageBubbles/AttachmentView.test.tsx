/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import { mockedGetURLAttachment, mockedGetURLPreview } from '../../../../jest-mocks';
import { AttachmentMessageType } from '../../../types/store/MessageTypes';
import AttachmentView from './AttachmentView';

describe('Attachment view', () => {
	test('Generic file visualization', async () => {
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: 'generic.zip',
			mimeType: 'application/zip',
			size: 21412
		};
		const { user } = setup(<AttachmentView attachment={genericAttachment} from={'from'} />);
		const genericIcon = await screen.findByTestId('icon: FileTextOutline');
		expect(genericIcon).toBeVisible();
		const fileName = await screen.findByText(genericAttachment.name);
		expect(fileName).toBeVisible();

		// Download is triggered
		mockedGetURLAttachment.mockReturnValue('image.jpg');
		await user.click(genericIcon);
		expect(mockedGetURLAttachment).toHaveBeenCalled();
	});

	test('Image visualization with preview', async () => {
		const imageAttachment: AttachmentMessageType = {
			id: 'pngAttachmentId',
			name: 'image.png',
			mimeType: 'image/png',
			size: 21412
		};
		setup(<AttachmentView attachment={imageAttachment} from={'from'} />);
		const imageName = await screen.findByText(imageAttachment.name);
		expect(imageName).toBeVisible();
	});

	test('Image visualization with error on preview', async () => {
		const imageAttachment: AttachmentMessageType = {
			id: 'pngAttachmentId',
			name: 'image.png',
			mimeType: 'image/png',
			size: 21412
		};
		mockedGetURLPreview.mockReturnValue('image.jpg');
		setup(<AttachmentView attachment={imageAttachment} from={'from'} />);
		const img = screen.getByTestId('attachmentImg');
		fireEvent.error(img);
		const imageName = await screen.findByText(imageAttachment.name);
		expect(imageName).toBeVisible();
		const genericIcon = await screen.findByTestId('icon: Image');
		expect(genericIcon).toBeVisible();
	});
});
