/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../../store/Store';
import { createMockMember, createMockRoom } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { FileToUpload } from '../../../types/store/ActiveConversationTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import UploadAttachmentManagerView from './UploadAttachmentManagerView';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

const imageFile = new File(['sunrise'], 'sunrise.png', {
	type: 'image/png'
});

const pdfFile = new File(['doc'], 'doc.pdf', {
	type: 'application/pdf'
});

const imageToUpload: FileToUpload = {
	file: imageFile,
	fileId: 'genericImageId',
	localUrl: 'localhost/generic/url',
	description: '',
	hasFocus: false
};

const pdfToUpload: FileToUpload = {
	file: pdfFile,
	fileId: 'genericAttachmentId',
	localUrl: 'localhost/generic/url',
	description: '',
	hasFocus: false
};

describe('Upload attachment view', () => {
	test('Test if upload manager is displayed when a file is added to be uploaded', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setFilesToAttach(mockedRoom.id, [imageToUpload]);
		setup(<UploadAttachmentManagerView roomId={mockedRoom.id} />);
		const uploadManager = await screen.findByTestId('upload_attachment_manager');
		expect(uploadManager).toBeVisible();
	});
	test('Test if image is displayed when added', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setFilesToAttach(mockedRoom.id, [imageToUpload]);
		setup(<UploadAttachmentManagerView roomId={mockedRoom.id} />);
		const fileToUpload = await screen.findByTestId(imageToUpload.fileId);
		expect(fileToUpload).toBeVisible();
	});
	test('Test if pdf is displayed when added', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setFilesToAttach(mockedRoom.id, [pdfToUpload]);
		setup(<UploadAttachmentManagerView roomId={mockedRoom.id} />);
		const fileToUpload = await screen.findByTestId(pdfToUpload.fileId);
		expect(fileToUpload).toBeVisible();
	});
	test('Test if add more attachment is visible when the upload manager is displayed', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setFilesToAttach(mockedRoom.id, [imageToUpload]);
		setup(<UploadAttachmentManagerView roomId={mockedRoom.id} />);
		const addFileAction = await screen.findByTestId('icon: Plus');
		expect(addFileAction).toBeVisible();
	});
	test('Test if file preview and remove actions are visible when hover on file', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setFilesToAttach(mockedRoom.id, [imageToUpload]);
		const { user } = setup(<UploadAttachmentManagerView roomId={mockedRoom.id} />);
		const fileToUpload = await screen.findByTestId(imageToUpload.fileId);
		expect(fileToUpload).toBeVisible();
		await user.hover(fileToUpload);
		const previewFileAction = await screen.findByTestId('icon: EyeOutline');
		expect(previewFileAction).toBeInTheDocument();
	});
	test('Test if pdf to upload has missing preview action', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setFilesToAttach(mockedRoom.id, [pdfToUpload]);
		const { user } = setup(<UploadAttachmentManagerView roomId={mockedRoom.id} />);
		const fileToUpload = await screen.findByTestId(pdfToUpload.fileId);
		expect(fileToUpload).toBeVisible();
		await user.hover(fileToUpload);
		const previewFileAction = screen.queryByTestId('icon: EyeOutline');
		expect(previewFileAction).not.toBeInTheDocument();
	});
});
