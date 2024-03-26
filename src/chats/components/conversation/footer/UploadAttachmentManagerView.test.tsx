/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import MessageComposer from './MessageComposer';
import UploadAttachmentManagerView from './UploadAttachmentManagerView';
import useStore from '../../../../store/Store';
import {
	createMockFile,
	createMockFileToUpload,
	createMockMember,
	createMockRoom,
	imageFile,
	pdfFile
} from '../../../../tests/createMock';
import { mockedImageSizeRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { FileToUpload } from '../../../../types/store/ActiveConversationTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import Chat from '../Chat';

const add1Attachment = 'Add 1 attachment';
const add2Attachments = 'Add 2 attachments';
const genericDescription = 'generic description';
const borderColor = 'border-color: #8bc34a';
const localhostGenericUrl = 'localhost/generic/url';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

const imageToUpload: FileToUpload = createMockFileToUpload();

const pdfToUpload: FileToUpload = createMockFileToUpload({
	file: pdfFile,
	fileId: 'genericAttachmentId'
});

const storeSetupBasic = (file: FileToUpload): UserEvent => {
	const store = useStore.getState();
	store.addRoom(mockedRoom);
	store.setFilesToAttach(mockedRoom.id, [file]);
	const { user } = setup(<UploadAttachmentManagerView roomId={mockedRoom.id} />);
	return user;
};

const storeSetupAdvanced = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.addRoom(mockedRoom);
	const { user } = setup(
		<>
			<UploadAttachmentManagerView roomId={mockedRoom.id} />
			<MessageComposer roomId={mockedRoom.id} />
		</>
	);
	return { user, store };
};

describe('Upload attachment view', () => {
	test('Test if upload manager is displayed when a file is added to be uploaded', async () => {
		storeSetupBasic(imageToUpload);
		const uploadManager = await screen.findByTestId('upload_attachment_manager');
		expect(uploadManager).toBeVisible();
	});
	test('Test if image is displayed when added', async () => {
		storeSetupBasic(imageToUpload);
		const fileToUpload = await screen.findByTestId(
			`previewFileUpload-${imageToUpload.file.name}-${imageToUpload.fileId}`
		);
		expect(fileToUpload).toBeVisible();
	});
	test('Test if pdf is displayed when added', async () => {
		storeSetupBasic(pdfToUpload);
		const fileToUpload = await screen.findByTestId(
			`previewFileUpload-${pdfToUpload.file.name}-${pdfToUpload.fileId}`
		);
		expect(fileToUpload).toBeVisible();
	});
	test('Test if add more attachment is visible when the upload manager is displayed', async () => {
		storeSetupBasic(imageToUpload);
		const addFileAction = await screen.findByTestId('icon: Plus');
		expect(addFileAction).toBeVisible();
	});
	test('Test if file preview and remove actions are visible when hover on file', async () => {
		const user = storeSetupBasic(imageToUpload);
		const fileToUpload = await screen.findByTestId(
			`previewFileUpload-${imageToUpload.file.name}-${imageToUpload.fileId}`
		);
		expect(fileToUpload).toBeVisible();
		await user.hover(fileToUpload);
		const previewFileAction = await screen.findByTestId('icon: EyeOutline');
		expect(previewFileAction).toBeInTheDocument();
	});
	test('Test if pdf to upload has missing preview action', async () => {
		const user = storeSetupBasic(pdfToUpload);
		const fileToUpload = await screen.findByTestId(
			`fileNoPreview-${pdfToUpload.file.name}-${pdfToUpload.fileId}`
		);
		expect(fileToUpload).toBeVisible();
		const titleCounter = screen.queryByText(add1Attachment);
		expect(titleCounter).toBeInTheDocument();
		await user.hover(fileToUpload);
		const previewFileAction = screen.queryByTestId('icon: EyeOutline');
		expect(previewFileAction).not.toBeInTheDocument();
	});
	test('input has text in it and user decides to upload one file from picker => files is shown as selected, the text in the input is set as description of the file and the input has focus', async () => {
		const { user } = storeSetupAdvanced();
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const textMessage = screen.queryByText(inputText);
		expect(textMessage).toBeInTheDocument();
		const attachmentToUpload = new File(['hello'], 'hello.png', { type: 'image/png' });
		const inputSelector: HTMLInputElement = screen.getByTestId('inputSelector');
		expect(inputSelector).not.toBeNull();
		expect(inputSelector.files).toHaveLength(0);
		await user.upload(inputSelector, attachmentToUpload);
		const titleCounter = screen.queryByText(add1Attachment);
		expect(titleCounter).toBeInTheDocument();
		expect(inputSelector.files).toHaveLength(1);
		const fileWithPreview = await screen.findByTestId(/previewImage-/);
		expect(fileWithPreview).toBeInTheDocument();
		expect(fileWithPreview).toHaveStyle(borderColor);
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBe(1);
		expect((filesToAttachUpdated as FileToUpload[])[0].hasFocus).toBeTruthy();
		expect((filesToAttachUpdated as FileToUpload[])[0].file.name).toBe('hello.png');
		const composerText = screen.queryByText(inputText);
		expect(composerText).toBeInTheDocument();
	});
	test('input has text in it and user decides to upload more file from picker => first file is shown as selected, the text in the input is set as description of the file and the input has focus', async () => {
		const { user } = storeSetupAdvanced();
		const inputText = genericDescription;
		const composerTextArea = await screen.findByTestId('textAreaComposer');
		await user.type(composerTextArea, inputText);
		const textMessage = await screen.findByText(/generic description/i);
		expect(textMessage).toBeInTheDocument();
		const attachmentToUploadOne = new File(['Hello'], 'Hello', { type: 'image/png' });
		const attachmentToUploadTwo = new File(['there'], 'there', { type: 'image/png' });
		const attachmentToUploadThree = new File(['General'], 'General', { type: 'image/png' });
		const attachmentToUploadFour = new File(['Kenobi'], 'Kenobi', { type: 'image/png' });
		const inputSelector: HTMLInputElement = screen.getByTestId('inputSelector');
		expect(inputSelector).not.toBeNull();
		expect(inputSelector.files).toHaveLength(0);
		await user.upload(inputSelector, [
			attachmentToUploadOne,
			attachmentToUploadTwo,
			attachmentToUploadThree,
			attachmentToUploadFour
		]);
		expect(inputSelector.files).toHaveLength(4);
		const titleCounter = screen.queryByText('Add 4 attachments');
		expect(titleCounter).toBeInTheDocument();
		const fileWithPreview = await screen.findByTestId(/previewImage-Hello/);
		expect(fileWithPreview).toBeInTheDocument();
		expect(fileWithPreview).toHaveStyle(borderColor);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(inputText);
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBe(4);
		expect((filesToAttachUpdated as FileToUpload[])[0].hasFocus).toBeTruthy();
		expect((filesToAttachUpdated as FileToUpload[])[1].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[2].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[3].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[0].file.name).toBe('Hello');
		const composerText = screen.queryByText(inputText);
		expect(composerText).toBeInTheDocument();
	});
	test('input has text in it and user decides to upload one file with drag&drop => files is shown as selected, the text in the input is set as description of the file and the input has focus', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		const { user } = setup(<Chat roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const chatComponent = await screen.findByTestId('conversationCollapsedView');
		const imgToDrag = new File(['Hello'], 'Hello', { type: 'image/png' });
		fireEvent.dragOver(chatComponent, { dataTransfer: { files: [imgToDrag] } });
		const dropContainer = await screen.findByTestId('dropZoneView');
		expect(dropContainer).toBeVisible();
		fireEvent.drop(dropContainer, { dataTransfer: { files: [imgToDrag] } });
		const uploadManager = await screen.findByTestId('upload_attachment_manager');
		expect(uploadManager).toBeInTheDocument();
		const titleCounter = screen.queryByText(add1Attachment);
		expect(titleCounter).toBeInTheDocument();
		const composerText = screen.queryByText(inputText);
		expect(composerText).toBeInTheDocument();
		const fileWithPreview = await screen.findByTestId(/previewImage-Hello/);
		expect(fileWithPreview).toBeInTheDocument();
		expect(fileWithPreview).toHaveStyle(borderColor);
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBe(1);
	});
	test('a file is selected with the description set in the input, user add a new file with picker => new file is added but the focus remains to the previous selected and description stay in the input', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileToUpload = {
			file: imageFile,
			fileId: 'genericImageId',
			localUrl: localhostGenericUrl,
			description: '',
			hasFocus: true
		};
		act(() => store.setFilesToAttach(mockedRoom.id, [fileToUpload]));
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const addFromManager = await screen.findByTestId('addMoreFilesFromManager');
		expect(addFromManager).toBeInTheDocument();
		const inputSelector: HTMLInputElement = screen.getByTestId('addMoreFilesInput');
		expect(inputSelector).not.toBeNull();
		const attachmentToUploadOne = new File(['Hello'], 'Hello', { type: 'image/png' });
		await user.upload(inputSelector, [attachmentToUploadOne]);
		expect(inputSelector.files).toHaveLength(1);
		const titleCounter = screen.queryByText(add2Attachments);
		expect(titleCounter).toBeInTheDocument();
		const fileWithPreview = await screen.findByTestId(/previewImage-Hello/);
		expect(fileWithPreview).toBeInTheDocument();
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBe(2);
		expect((filesToAttachUpdated as FileToUpload[])[0].hasFocus).toBeTruthy();
		expect((filesToAttachUpdated as FileToUpload[])[1].hasFocus).toBeFalsy();
		const fileWithFocus = await screen.findByTestId(
			`previewImage-${imageFile.name}-${fileToUpload.fileId}`
		);
		expect(fileWithFocus).toBeInTheDocument();
		expect(fileWithFocus).toHaveStyle(borderColor);
		const textMessage = screen.queryByText(inputText);
		expect(textMessage).toBeInTheDocument();
	});
	test('a file is selected with the description set in the input, user add more files with picker => new files are added but the focus remains to the previous selected and description stay in the input', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileToUpload = {
			file: imageFile,
			fileId: 'genericImageId',
			localUrl: localhostGenericUrl,
			description: '',
			hasFocus: true
		};
		act(() => store.setFilesToAttach(mockedRoom.id, [fileToUpload]));
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const addFromManager = await screen.findByTestId('addMoreFilesFromManager');
		expect(addFromManager).toBeInTheDocument();
		const inputSelector: HTMLInputElement = screen.getByTestId('addMoreFilesInput');
		expect(inputSelector).not.toBeNull();
		const attOne = new File(['Hello'], 'Hello', { type: 'image/png' });
		const attTwo = new File(['there'], 'there', { type: 'image/png' });
		const attThree = new File(['General'], 'General', { type: 'image/png' });
		const attFour = new File(['Kenobi'], 'Kenobi', { type: 'image/png' });
		await user.upload(inputSelector, [attOne, attTwo, attThree, attFour]);
		expect(inputSelector.files).toHaveLength(4);
		const fileWithPreview = await screen.findByTestId(/previewImage-Hello/);
		expect(fileWithPreview).toBeInTheDocument();
		const titleCounter = screen.queryByText('Add 5 attachments');
		expect(titleCounter).toBeInTheDocument();
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBe(5);
		expect((filesToAttachUpdated as FileToUpload[])[0].hasFocus).toBeTruthy();
		expect((filesToAttachUpdated as FileToUpload[])[1].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[2].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[3].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[4].hasFocus).toBeFalsy();
		const fileWithFocus = await screen.findByTestId(
			`previewImage-${imageFile.name}-${fileToUpload.fileId}`
		);
		expect(fileWithFocus).toBeInTheDocument();
		expect(fileWithFocus).toHaveStyle(borderColor);
		const textMessage = screen.queryByText(inputText);
		expect(textMessage).toBeInTheDocument();
	});
	test('there is a file with description in the attachmentViewManager and user remove it with preview action => the widget will become closed and the input get cleared', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileToUpload = {
			file: imageFile,
			fileId: 'genericImageId',
			localUrl: localhostGenericUrl,
			description: '',
			hasFocus: true
		};
		act(() => store.setFilesToAttach(mockedRoom.id, [fileToUpload]));
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const file = await screen.findByTestId(
			`previewFileUpload-${fileToUpload.file.name}-${fileToUpload.fileId}`
		);
		expect(file).toBeVisible();
		await user.hover(file);
		const removeFileButton = await screen.findByTestId(`removeSingleFile-${fileToUpload.fileId}`);
		expect(removeFileButton).toBeInTheDocument();
		await user.click(removeFileButton);
		expect(screen.queryByTestId('upload_attachment_manager')).not.toBeInTheDocument();
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBeUndefined();
	});
	test('there is a file with description in the attachmentViewManager and user close the widget => the widget will become closed and the input get cleared and the file removed', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ hasFocus: true });
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne]));
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		expect(screen.queryByTestId('upload_attachment_manager')).toBeVisible();
		const closeFilesManagerBtn = await screen.findByTestId('closeFilesManager');
		await user.click(closeFilesManagerBtn);
		expect(screen.queryByTestId('upload_attachment_manager')).not.toBeInTheDocument();
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBeUndefined();
	});
	test('there is a file selected with description and other files in the attachmentViewManager and user removes the selected one with preview action => the file selected will be removed, the input will be cleared and set as selected the file at the right of the deleted one if present otherwise set selected the one at the left and if present set the description of that file in the input', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ hasFocus: true });
		const fileTwo = createMockFileToUpload({
			fileId: 'fileTwo',
			file: createMockFile({ name: 'Hello', options: { type: 'image/png' } })
		});
		const fileThree = createMockFileToUpload({
			fileId: 'fileThree',
			file: createMockFile({ name: 'there!', options: { type: 'image/png' } })
		});
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne, fileTwo, fileThree]));
		const inputText = genericDescription;
		const titleCounter = screen.queryByText('Add 3 attachments');
		expect(titleCounter).toBeInTheDocument();
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const file = await screen.findByTestId(
			`previewFileUpload-${fileOne.file.name}-${fileOne.fileId}`
		);
		expect(file).toBeVisible();
		await user.hover(file);
		const removeFileButton = await screen.findByTestId(`removeSingleFile-${fileOne.fileId}`);
		await user.click(removeFileButton);
		const newFileSelected = await screen.findByTestId(
			`previewImage-${fileTwo.file.name}-${fileTwo.fileId}`
		);
		expect(newFileSelected).toBeInTheDocument();
		const titleCounterUpdated = screen.queryByText(add2Attachments);
		expect(titleCounterUpdated).toBeInTheDocument();
		expect(newFileSelected).toHaveStyle(borderColor);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
	});
	test('there is a file selected with description and other files in the attachmentViewManager and user removes the selected one with preview action => the file selected will be removed, the input will be cleared and set selected the one at the left and if present set the description of that file in the input', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ description: 'file one description' });
		const fileTwo = createMockFileToUpload({
			hasFocus: true,
			fileId: 'fileTwo',
			file: createMockFile({ name: 'Hello', options: { type: 'image/png' } })
		});
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne, fileTwo]));
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const file = await screen.findByTestId(
			`previewFileUpload-${fileTwo.file.name}-${fileTwo.fileId}`
		);
		expect(file).toBeVisible();
		await user.hover(file);
		const removeFileButton = await screen.findByTestId(`removeSingleFile-${fileTwo.fileId}`);
		await user.click(removeFileButton);
		const titleCounter = screen.queryByText(add1Attachment);
		expect(titleCounter).toBeInTheDocument();
		const newFileSelected = await screen.findByTestId(
			`previewImage-${fileOne.file.name}-${fileOne.fileId}`
		);
		expect(newFileSelected).toBeInTheDocument();
		expect(newFileSelected).toHaveStyle(borderColor);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('file one description');
	});
	test('there is a file selected with description and other files in the attachmentViewManager and user close the widget => the widget will become closed and the input get cleared and the file removed', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ hasFocus: true });
		const fileTwo = createMockFileToUpload({
			fileId: 'fileTwo',
			file: createMockFile({ name: 'Hello' })
		});
		const fileThree = createMockFileToUpload({
			fileId: 'fileThree',
			file: createMockFile({ name: 'there!' })
		});
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne, fileTwo, fileThree]));
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		expect(screen.queryByTestId('upload_attachment_manager')).toBeVisible();
		const closeFilesManagerBtn = await screen.findByTestId('closeFilesManager');
		await user.click(closeFilesManagerBtn);
		expect(screen.queryByTestId('upload_attachment_manager')).not.toBeInTheDocument();
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBeUndefined();
	});
	test('input has text in it and user decides to upload more file with drag&drop => first file is shown as selected, the text in the input is set as description of the file and the input has focus', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		const { user } = setup(<Chat roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const aA = screen.queryByText(inputText);
		expect(aA).toBeInTheDocument();
		const chatComponent = await screen.findByTestId('conversationCollapsedView');
		const imgOne = new File(['Hello'], 'Hello', { type: 'image/png' });
		const imgTwo = new File(['there'], 'there', { type: 'image/png' });
		const imgThree = new File(['General'], 'General', { type: 'image/png' });
		const imgFour = new File(['Kenobi'], 'Kenobi', { type: 'image/png' });
		const filesArray = [imgOne, imgTwo, imgThree, imgFour];
		fireEvent.dragOver(chatComponent, { dataTransfer: { files: filesArray } });
		const dropContainer = await screen.findByTestId('dropZoneView');
		expect(dropContainer).toBeVisible();
		fireEvent.drop(dropContainer, { dataTransfer: { files: filesArray } });
		const titleCounter = screen.queryByText('Add 4 attachments');
		expect(titleCounter).toBeInTheDocument();
		const composerText = screen.queryByText(inputText);
		expect(composerText).toBeInTheDocument();
		const fileWithPreview = await screen.findByTestId(/previewImage-Hello/);
		expect(fileWithPreview).toBeInTheDocument();
		expect(fileWithPreview).toHaveStyle(borderColor);
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBe(4);
		expect((filesToAttachUpdated as FileToUpload[])[0].file.name).toBe('Hello');
		expect((filesToAttachUpdated as FileToUpload[])[0].hasFocus).toBeTruthy();
		expect((filesToAttachUpdated as FileToUpload[])[1].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[2].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[3].hasFocus).toBeFalsy();
	});
	test('a file is selected with the description set in the input, user add a new file with drag&drop => new file is added but the focus remains to the previous selected and description stay in the input', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		const { user } = setup(<Chat roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		const inputText = genericDescription;
		const fileOne = createMockFileToUpload({
			fileId: 'fileOne',
			hasFocus: true,
			file: createMockFile({ name: 'Hello', options: { type: 'image/png' } })
		});
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne]));
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const titleCounter = screen.queryByText(add1Attachment);
		expect(titleCounter).toBeInTheDocument();
		const chatComponent = await screen.findByTestId('conversationCollapsedView');
		const imgOne = new File(['Hello'], 'Hello', { type: 'image/png' });
		fireEvent.dragOver(chatComponent, { dataTransfer: { files: [imgOne] } });
		const dropContainer = await screen.findByTestId('dropZoneView');
		expect(dropContainer).toBeVisible();
		fireEvent.drop(dropContainer, { dataTransfer: { files: [imgOne] } });
		const uploadManager = await screen.findByTestId('upload_attachment_manager');
		expect(uploadManager).toBeInTheDocument();
		const titleCounterUpdated = screen.queryByText(add2Attachments);
		expect(titleCounterUpdated).toBeInTheDocument();
		const composerText = screen.queryByText(inputText);
		expect(composerText).toBeInTheDocument();
	});
	test('a file is selected with the description set in the input, user add more files with drag&drop => new files are added but the focus remains to the previous selected and description stay in the input', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		const { user } = setup(<Chat roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		const inputText = genericDescription;
		const fileOne = createMockFileToUpload({
			fileId: 'fileOne',
			hasFocus: true,
			file: createMockFile({ name: 'sunrise', options: { type: 'image/png' } })
		});
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne]));
		const titleCounter = screen.queryByText(add1Attachment);
		expect(titleCounter).toBeInTheDocument();
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const chatComponent = await screen.findByTestId('conversationCollapsedView');
		const imgOne = new File(['Hello'], 'Hello', { type: 'image/png' });
		const imgTwo = new File(['there'], 'there', { type: 'image/png' });
		const imgThree = new File(['General'], 'General', { type: 'image/png' });
		const imgFour = new File(['Kenobi'], 'Kenobi', { type: 'image/png' });
		const filesArray = [imgOne, imgTwo, imgThree, imgFour];
		fireEvent.dragOver(chatComponent, { dataTransfer: { files: filesArray } });
		const dropContainer = await screen.findByTestId('dropZoneView');
		expect(dropContainer).toBeVisible();
		fireEvent.drop(dropContainer, { dataTransfer: { files: filesArray } });
		const uploadManager = await screen.findByTestId('upload_attachment_manager');
		expect(uploadManager).toBeInTheDocument();
		const titleCounterUpdated = screen.queryByText('Add 5 attachments');
		expect(titleCounterUpdated).toBeInTheDocument();
		const composerText = screen.queryByText(inputText);
		expect(composerText).toBeInTheDocument();
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBe(5);
		expect((filesToAttachUpdated as FileToUpload[])[0].file.name).toBe('sunrise');
		expect((filesToAttachUpdated as FileToUpload[])[0].hasFocus).toBeTruthy();
		expect((filesToAttachUpdated as FileToUpload[])[1].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[2].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[3].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[4].hasFocus).toBeFalsy();
	});
	test('Save description - input has text, file is selected and user click in another file => description of the file will be saved', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ hasFocus: true });
		const fileTwo = createMockFileToUpload({
			fileId: 'fileTwo',
			file: createMockFile({ name: 'Hello', options: { type: 'image/png' } })
		});
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne, fileTwo]));
		const inputText = 'description fileOne';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const fileTwoToFocus = await screen.findByTestId(
			`previewFileUpload-${fileTwo.file.name}-${fileTwo.fileId}`
		);
		await user.click(fileTwoToFocus);
		const newFileSelected = await screen.findByTestId(
			`previewImage-${fileTwo.file.name}-${fileTwo.fileId}`
		);
		expect(newFileSelected).toBeInTheDocument();
		expect(newFileSelected).toHaveStyle(borderColor);
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect((filesToAttachUpdated as FileToUpload[])[0].description).toBe(inputText);
		expect((filesToAttachUpdated as FileToUpload[])[0].hasFocus).toBeFalsy();
		expect((filesToAttachUpdated as FileToUpload[])[1].hasFocus).toBeTruthy();
	});
	test('Keep description - input has text, file is selected and user add new file from picker => description of the file will be kept in the input and the old file will stay focused', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ hasFocus: true });
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne]));
		const inputText = 'description fileOne';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		const inputSelector: HTMLInputElement = screen.getByTestId('addMoreFilesInput');
		const lastFileUploaded = createMockFile({ name: 'Hello', options: { type: 'image/png' } });
		await user.upload(inputSelector, [lastFileUploaded]);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(inputText);
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBe(2);
		expect((filesToAttachUpdated as FileToUpload[])[0].description).toBe('');
		expect((filesToAttachUpdated as FileToUpload[])[0].hasFocus).toBeTruthy();
		expect((filesToAttachUpdated as FileToUpload[])[1].hasFocus).toBeFalsy();
		const fileOld = await screen.findByTestId(
			`previewImage-${fileOne.file.name}-${fileOne.fileId}`
		);
		expect(fileOld).toBeInTheDocument();
		expect(fileOld).toHaveStyle(borderColor);
	});
	test('Save description - input has text, file is selected and user press ENTER => description of the file will be saved, and message sent', async () => {
		mockedImageSizeRequest.mockReturnValue({ width: 10, height: 10 });
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ hasFocus: true });
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne]));
		const inputText = 'description fileOne{enter}';
		const composerTextArea = screen.getByRole('textbox');
		await waitFor(() => user.type(composerTextArea, inputText), { timeout: 3000 });
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBeUndefined();
	});
	test('Save description - input has text, file is selected and user click send button => description of the file will be saved, and message sent', async () => {
		mockedImageSizeRequest.mockReturnValue({ width: 10, height: 10 });
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ hasFocus: true });
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne]));
		const sendButton = screen.getByTestId('icon: Navigation2');
		expect(sendButton).not.toBeDisabled();
		await waitFor(() => user.click(sendButton));
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		const updatedStore = useStore.getState();
		const filesToAttachUpdated = updatedStore.activeConversations[mockedRoom.id].filesToAttach;
		expect(filesToAttachUpdated?.length).toBeUndefined();
	});
	test('Remove description - file is selected and so the input has the description and user clean the input manually => description will be removed', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ hasFocus: true });
		act(() => store.setFilesToAttach(mockedRoom.id, [fileOne]));
		const inputText = 'hello';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		await user.type(composerTextArea, '{backspace}{backspace}{backspace}{backspace}{backspace}');
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
	});
});
