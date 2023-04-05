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
// import MessageComposer from './MessageComposer';
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
		const fileToUpload = await screen.findByTestId(
			`previewFileUpload-${imageToUpload.file.name}-${imageToUpload.fileId}`
		);
		expect(fileToUpload).toBeVisible();
	});
	test('Test if pdf is displayed when added', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setFilesToAttach(mockedRoom.id, [pdfToUpload]);
		setup(<UploadAttachmentManagerView roomId={mockedRoom.id} />);
		const fileToUpload = await screen.findByTestId(
			`previewFileUpload-${pdfToUpload.file.name}-${pdfToUpload.fileId}`
		);
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
		const fileToUpload = await screen.findByTestId(
			`previewFileUpload-${imageToUpload.file.name}-${imageToUpload.fileId}`
		);
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
		const fileToUpload = await screen.findByTestId(
			`fileNoPreview-${pdfToUpload.file.name}-${pdfToUpload.fileId}`
		);
		expect(fileToUpload).toBeVisible();
		await user.hover(fileToUpload);
		const previewFileAction = screen.queryByTestId('icon: EyeOutline');
		expect(previewFileAction).not.toBeInTheDocument();
	});
});

describe('Upload', () => {
	// test('input has text in it and user decides to upload more file from picker => first file is shown as selected, the text in the input is set as description of the file and the input has focus', async () => {
	// 	const store = useStore.getState();
	// 	store.addRoom(mockedRoom);
	// 	const { user } = setup(
	// 		<>
	// 			<UploadAttachmentManagerView roomId={mockedRoom.id} />
	// 			<MessageComposer roomId={mockedRoom.id} />
	// 		</>
	// 	);
	// 	const inputText = 'generic description for multi upload';
	// 	const composerTextArea = await screen.findByTestId('textAreaComposer');
	// 	await user.type(composerTextArea, inputText);
	// 	const textMessage = await screen.findByText(/generic description for multi upload/i);
	// 	expect(textMessage).toBeInTheDocument();
	// 	const attachmentToUploadOne = new File(['Hello'], 'Hello', { type: 'image/png' });
	// 	const attachmentToUploadTwo = new File(['there'], 'there', { type: 'image/png' });
	// 	const attachmentToUploadThree = new File(['General'], 'General', { type: 'image/png' });
	// 	const attachmentToUploadFour = new File(['Kenobi'], 'Kenobi', { type: 'image/png' });
	// 	const inputSelector: HTMLInputElement = screen.getByTestId('inputSelector');
	// 	expect(inputSelector).not.toBeNull();
	// 	expect(inputSelector.files).toHaveLength(0);
	// 	await user.upload(inputSelector, [
	// 		attachmentToUploadOne,
	// 		attachmentToUploadTwo,
	// 		attachmentToUploadThree,
	// 		attachmentToUploadFour
	// 	]);
	// 	expect(inputSelector.files).toHaveLength(4);
	// 	const fileWithPreview = await screen.findByTestId(/previewImage-Hello/);
	// 	expect(fileWithPreview).toBeInTheDocument();
	// 	expect(fileWithPreview).toHaveStyle('border-color: #8bc34a');
	// 	const composer = await screen.findByTestId('textAreaComposer');
	// 	expect((composer as HTMLTextAreaElement).value).toBe(inputText);
	// });
	// test('input has text in it and user decides to upload one file from picker => files is shown as selected, the text in the input is set as description of the file and the input has focus', async () => {
	// 	const store = useStore.getState();
	// 	store.addRoom(mockedRoom);
	// 	const { user } = setup(
	// 		<>
	// 			<UploadAttachmentManagerView roomId={mockedRoom.id} />
	// 			<MessageComposer roomId={mockedRoom.id} />
	// 		</>
	// 	);
	// 	const composerTextArea = await screen.findByTestId('textAreaComposer');
	// 	await user.type(composerTextArea, 'generic file description');
	// 	const textMessage = screen.queryByText(/generic file description/i);
	// 	expect(textMessage).toBeInTheDocument();
	// 	const attachmentToUpload = new File(['hello'], 'hello.png', { type: 'image/png' });
	// 	const inputSelector: HTMLInputElement = screen.getByTestId('inputSelector');
	// 	expect(inputSelector).not.toBeNull();
	// 	expect(inputSelector.files).toHaveLength(0);
	// 	await user.upload(inputSelector, attachmentToUpload);
	// 	expect(inputSelector.files).toHaveLength(1);
	// 	const fileWithPreview = await screen.findByTestId(/previewImage-/);
	// 	expect(fileWithPreview).toBeInTheDocument();
	// 	expect(fileWithPreview).toHaveStyle('border-color: #8bc34a');
	// 	// todo  richiamo lo store aggiornato.....
	// });
});

test.todo('check header counter also');

test.todo(
	'input has text in it and user decides to upload one file with drag&drop => files is shown as selected, the text in the input is set as description of the file and the input has focus'
);

test.todo(
	'input has text in it and user decides to upload more file with drag&drop => first file is shown as selected, the text in the input is set as description of the file and the input has focus'
);

test.todo(
	'a file is selected with the description set in the input, user add a new file with picker => new file is added but the focus remains to the previous selected and description stay in the input'
);

test.todo(
	'a file is selected with the description set in the input, user add a new file with drag&drop => new file is added but the focus remains to the previous selected and description stay in the input'
);

test.todo(
	'a file is selected with the description set in the input, user add more files with picker => new files are added but the focus remains to the previous selected and description stay in the input'
);

test.todo(
	'a file is selected with the description set in the input, user add more files with drag&drop => new files are added but the focus remains to the previous selected and description stay in the input'
);

test.todo(
	'there is a file with description in the attachmentViewManager and user remove it with preview action=> the widget will become closed and the input get cleared'
);

test.todo(
	'there is a file with description in the attachmentViewManager and user close the widget=> the widget will become closed and the input get cleared and the file removed'
);

test.todo(
	'there is a file selected with description and other files in the attachmentViewManager and user removes the selected one with preview action => the file selected will be removed, the input will be cleared and set as selected the file at the right of the deleted one if present otherwise set selected the one at the left and if present set the description of that file in the input'
);

test.todo(
	'there is a file selected with description and other files in the attachmentViewManager and user close the widget => the widget will become closed and the input get cleared and the file removed'
);

test.todo(
	'Save description - input has text, file is selected and user click in another file => description of the file will be saved'
);

test.todo(
	'Save description - input has text, file is selected and user add new file from picker => description of the file will be saved and new file is set as focused'
);

test.todo(
	'Save description - input has text, file is selected and user press ENTER => description of the file will be saved, and message sent'
);

test.todo(
	'Save description - input has text, file is selected and user click send button => description of the file will be saved, and message sent'
);

test.todo(
	'Remove description - file is selected and so the input has the description and user clean the input manually => description will be removed'
);

test.todo(
	'Remove description - file is selected and so the input has the description and user click the clean button => description will be removed'
);

test.todo(
	'Remove description - file is selected and so the input has the description and user remove the file => description will be removed'
);

test.todo(
	'Send attachment - file is selected, description is in the input and user click send button => widget closed, input cleared and attachment send with the description'
);

test.todo(
	'Send attachment - file is selected, description is in the input and user press ENTER => widget closed, input cleared and attachment send with the description'
);

test.todo(
	'File uploading - user sent the attachment => a spinner icon is displayed while the uploading occur'
);

test.todo(
	'File uploading - user sent the attachment and hover the spinner => a close button appear to stop the upload'
);

test.todo(
	'Block upload - user sent the attachment, hover the spinner and click the stop button => the upload will be stopped and a snackbar will be displayed'
);
