/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import AttachmentSmallView from './AttachmentSmallView';
import {
	mockedGetImageThumbnailURL,
	mockedGetURLAttachment
} from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { AttachmentMessageType } from '../../../../types/store/MessageTypes';

describe('Attachment Small view', () => {
	test('Download generic file', async () => {
		const genericAttachment: AttachmentMessageType = {
			id: 'genericAttachmentId',
			name: 'generic.zip',
			mimeType: 'application/zip',
			size: 21412
		};
		const { user } = setup(<AttachmentSmallView attachment={genericAttachment} />);
		const genericIcon = await screen.findByTestId('icon: FileTextOutline');
		expect(genericIcon).toBeVisible();

		// Hover action is shown
		await user.hover(screen.getByTestId('hover-container'));
		const downloadIcon = screen.getByTestId('icon: DownloadOutline');
		expect(downloadIcon).toBeInTheDocument();

		// Download action is triggered
		await user.click(downloadIcon);
		expect(mockedGetURLAttachment).toHaveBeenCalledTimes(1);
	});

	test('Preview image file', async () => {
		const imageAttachment: AttachmentMessageType = {
			id: 'pngAttachmentId',
			name: 'image.png',
			mimeType: 'image/png',
			size: 21412
		};
		const { user } = setup(<AttachmentSmallView attachment={imageAttachment} />);

		// Hover action is shown
		await user.hover(screen.getByTestId('hover-container'));
		const previewIcon = screen.getByTestId('icon: EyeOutline');
		expect(previewIcon).toBeInTheDocument();

		// preview action is triggered
		await user.click(previewIcon);
		expect(mockedGetImageThumbnailURL).toHaveBeenCalled();
	});
});
