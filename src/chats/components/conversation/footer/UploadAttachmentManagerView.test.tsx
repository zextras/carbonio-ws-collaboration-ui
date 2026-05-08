/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import useStore from '../../../../store/Store';
import {
	createMockFile,
	createMockFileToUpload,
	createMockMember,
	createMockRoom,
	pdfFile
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { FileToUpload } from '../../../../types/store/ActiveConversationTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import Chat from '../Chat';
import ConversationFooter from './ConversationFooter';

const add1Attachment = 'Add 1 attachment';
const add2Attachments = 'Add 2 attachments';
const genericDescription = 'generic description';

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
	store.addFilesToAttach(mockedRoom.id, [file]);
	const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);
	return user;
};

const storeSetupAdvanced = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);
	return { user, store };
};

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([mockedRoom]);
});

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
	test('input has text in it and user decides to upload one file from picker => file is shown and input text is preserved', async () => {
		const { user } = storeSetupAdvanced();
		const inputText = genericDescription;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		expect(screen.getByText(inputText)).toBeInTheDocument();
		const attachmentToUpload = new File(['hello'], 'hello.png', { type: 'image/png' });
		const inputSelector: HTMLInputElement = screen.getByTestId('inputSelector');
		await user.upload(inputSelector, attachmentToUpload);
		const titleCounter = screen.queryByText(add1Attachment);
		expect(titleCounter).toBeInTheDocument();
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toHaveLength(1);
		const fileWithPreview = await screen.findByTestId(/previewImage-/);
		expect(fileWithPreview).toBeInTheDocument();
		expect(screen.getByText(inputText)).toBeInTheDocument();
	});
	test('input has text in it and user decides to upload more files from picker => files are shown and input text is preserved', async () => {
		const { user } = storeSetupAdvanced();
		const inputText = genericDescription;
		const composerTextArea = await screen.findByTestId('textAreaComposer');
		await user.type(composerTextArea, inputText);
		expect(await screen.findByText(/generic description/i)).toBeInTheDocument();
		const attachments = [
			new File(['Hello'], 'Hello', { type: 'image/png' }),
			new File(['there'], 'there', { type: 'image/png' }),
			new File(['General'], 'General', { type: 'image/png' }),
			new File(['Kenobi'], 'Kenobi', { type: 'image/png' })
		];
		const inputSelector: HTMLInputElement = screen.getByTestId('inputSelector');
		await user.upload(inputSelector, attachments);
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toHaveLength(4);
		expect(screen.getByText('Add 4 attachments')).toBeInTheDocument();
		expect(screen.getByText(inputText)).toBeInTheDocument();
	});
	test('input has text in it and user decides to upload one file with drag&drop => file is shown and input text is preserved', async () => {
		const { user } = setup(<Chat roomId={mockedRoom.id} />);
		const inputText = genericDescription;
		await user.type(screen.getByRole('textbox'), inputText);
		const chatComponent = await screen.findByTestId('conversationCollapsedView');
		const imgToDrag = new File(['Hello'], 'Hello', { type: 'image/png' });
		fireEvent.dragOver(chatComponent, { dataTransfer: { files: [imgToDrag] } });
		const dropContainer = await screen.findByTestId('dropZoneView');
		fireEvent.drop(dropContainer, { dataTransfer: { files: [imgToDrag] } });
		expect(await screen.findByTestId('upload_attachment_manager')).toBeInTheDocument();
		expect(screen.getByText(add1Attachment)).toBeInTheDocument();
		expect(screen.getByText(inputText)).toBeInTheDocument();
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toHaveLength(1);
	});
	test('text is preserved when a single file is removed via the remove button', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileToUpload = createMockFileToUpload();
		act(() => store.addFilesToAttach(mockedRoom.id, [fileToUpload]));
		const inputText = genericDescription;
		await user.type(screen.getByRole('textbox'), inputText);
		const file = await screen.findByTestId(
			`previewFileUpload-${fileToUpload.file.name}-${fileToUpload.fileId}`
		);
		await user.hover(file);
		const removeFileButton = await screen.findByTestId(`removeSingleFile-${fileToUpload.fileId}`);
		await user.click(removeFileButton);
		expect(screen.queryByTestId('upload_attachment_manager')).not.toBeInTheDocument();
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(inputText);
	});
	test('text is preserved when the attachment manager is closed with the close button', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload();
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne]));
		const inputText = genericDescription;
		await user.type(screen.getByRole('textbox'), inputText);
		expect(screen.queryByTestId('upload_attachment_manager')).toBeVisible();
		await user.click(await screen.findByTestId('closeFilesManager'));
		expect(screen.queryByTestId('upload_attachment_manager')).not.toBeInTheDocument();
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(inputText);
	});
	test('text is preserved when one of multiple files is removed', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload();
		const fileTwo = createMockFileToUpload({
			fileId: 'fileTwo',
			file: createMockFile({ name: 'Hello', options: { type: 'image/png' } })
		});
		const fileThree = createMockFileToUpload({
			fileId: 'fileThree',
			file: createMockFile({ name: 'there!', options: { type: 'image/png' } })
		});
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne, fileTwo, fileThree]));
		expect(screen.getByText('Add 3 attachments')).toBeInTheDocument();
		await user.type(screen.getByRole('textbox'), genericDescription);
		const file = await screen.findByTestId(
			`previewFileUpload-${fileOne.file.name}-${fileOne.fileId}`
		);
		await user.hover(file);
		await user.click(await screen.findByTestId(`removeSingleFile-${fileOne.fileId}`));
		expect(screen.getByText(add2Attachments)).toBeInTheDocument();
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(genericDescription);
	});
	test('text is preserved when multiple files are removed leaving just one', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload({ fileId: 'fileOne' });
		const fileTwo = createMockFileToUpload({
			fileId: 'fileTwo',
			file: createMockFile({ name: 'Hello', options: { type: 'image/png' } })
		});
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne, fileTwo]));
		await user.type(screen.getByRole('textbox'), genericDescription);
		const file = await screen.findByTestId(
			`previewFileUpload-${fileTwo.file.name}-${fileTwo.fileId}`
		);
		await user.hover(file);
		await user.click(await screen.findByTestId(`removeSingleFile-${fileTwo.fileId}`));
		expect(screen.getByText(add1Attachment)).toBeInTheDocument();
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(genericDescription);
	});
	test('text is preserved when multiple files and attachment manager is closed', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload();
		const fileTwo = createMockFileToUpload({
			fileId: 'fileTwo',
			file: createMockFile({ name: 'Hello' })
		});
		const fileThree = createMockFileToUpload({
			fileId: 'fileThree',
			file: createMockFile({ name: 'there!' })
		});
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne, fileTwo, fileThree]));
		await user.type(screen.getByRole('textbox'), genericDescription);
		expect(screen.queryByTestId('upload_attachment_manager')).toBeVisible();
		await user.click(await screen.findByTestId('closeFilesManager'));
		expect(screen.queryByTestId('upload_attachment_manager')).not.toBeInTheDocument();
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(genericDescription);
	});
	test('input has text in it and user decides to upload more files with drag&drop => files are added and text is preserved', async () => {
		const { user } = setup(<Chat roomId={mockedRoom.id} />);
		const inputText = genericDescription;
		await user.type(screen.getByRole('textbox'), inputText);
		expect(screen.getByText(inputText)).toBeInTheDocument();
		const chatComponent = await screen.findByTestId('conversationCollapsedView');
		const filesArray = [
			new File(['Hello'], 'Hello', { type: 'image/png' }),
			new File(['there'], 'there', { type: 'image/png' }),
			new File(['General'], 'General', { type: 'image/png' }),
			new File(['Kenobi'], 'Kenobi', { type: 'image/png' })
		];
		fireEvent.dragOver(chatComponent, { dataTransfer: { files: filesArray } });
		const dropContainer = await screen.findByTestId('dropZoneView');
		fireEvent.drop(dropContainer, { dataTransfer: { files: filesArray } });
		expect(screen.getByText('Add 4 attachments')).toBeInTheDocument();
		expect(screen.getByText(inputText)).toBeInTheDocument();
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toHaveLength(4);
	});
	test('adding a new file from picker while composing does not clear the text', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload();
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne]));
		const inputText = genericDescription;
		await user.type(screen.getByRole('textbox'), inputText);
		const inputSelector: HTMLInputElement = screen.getByTestId('addMoreFilesInput');
		await user.upload(inputSelector, [
			createMockFile({ name: 'Hello', options: { type: 'image/png' } })
		]);
		expect(screen.getByText(add2Attachments)).toBeInTheDocument();
		expect(screen.getByText(inputText)).toBeInTheDocument();
	});
	test('input has text, file is present, user presses ENTER => message sent and input cleared', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload();
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne]));
		await user.type(screen.getByRole('textbox'), 'description fileOne{enter}');
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();
	});
	test('input has text, file is present, user clicks send button => message sent and input cleared', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload();
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne]));
		const sendButton = screen.getByTestId('icon: Navigation2');
		expect(sendButton).not.toBeDisabled();
		await user.click(sendButton);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();
	});
	test('input has text, user manually clears it => input is empty', async () => {
		const { user, store } = storeSetupAdvanced();
		const fileOne = createMockFileToUpload();
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne]));
		const inputText = 'hello';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, inputText);
		await user.type(composerTextArea, '{backspace}{backspace}{backspace}{backspace}{backspace}');
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
	});
	test('no green border is shown on any file in the attachment manager', async () => {
		const { store } = storeSetupAdvanced();
		const borderColor = 'border-color: #8bc34a';
		const fileOne = createMockFileToUpload({
			file: createMockFile({ name: 'First', options: { type: 'image/png' } }),
			fileId: 'fileOne'
		});
		const fileTwo = createMockFileToUpload({
			file: createMockFile({ name: 'Second', options: { type: 'image/png' } }),
			fileId: 'fileTwo'
		});
		act(() => store.addFilesToAttach(mockedRoom.id, [fileOne, fileTwo]));
		const firstFilePreview = await screen.findByTestId(
			`previewImage-${fileOne.file.name}-${fileOne.fileId}`
		);
		expect(firstFilePreview).not.toHaveStyle(borderColor);
		const secondFilePreview = await screen.findByTestId(
			`previewImage-${fileTwo.file.name}-${fileTwo.fileId}`
		);
		expect(secondFilePreview).not.toHaveStyle(borderColor);
	});
});
