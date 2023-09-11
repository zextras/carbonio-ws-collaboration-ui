/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createEvent, fireEvent, screen, waitFor } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event/setup/setup';
import React from 'react';
import { setup } from 'test-utils';

import MessageComposer from './MessageComposer';
import UploadAttachmentManagerView from './UploadAttachmentManagerView';
import { mockedAddRoomAttachmentRequest } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockFile, createMockMember, createMockRoom } from '../../../tests/createMock';
import { mockedSendIsWriting, mockedSendPaused } from '../../../tests/mockedXmppClient';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { FileToUpload, messageActionType } from '../../../types/store/ActiveConversationTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

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

const marioPicture = createMockFile({ name: 'Mario', options: { type: 'image/png' } });
const luigiPicture = createMockFile({ name: 'Luigi', options: { type: 'image/png' } });
const peachPicture = createMockFile({ name: 'Peach', options: { type: 'image/png' } });

describe('MessageComposer', () => {
	test('Open/close emoji picker by hovering it', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);

		// Initial state
		expect(screen.queryByTestId('emojiPicker')).not.toBeInTheDocument();

		// hover on emoji button
		const emojiButton = screen.getAllByRole('button')[0];
		user.hover(emojiButton);
		const emojiPicker = await screen.findByTestId('emojiPicker');
		expect(emojiPicker).toBeInTheDocument();

		// hover on emojiPicker
		user.hover(emojiPicker);
		expect(emojiPicker).toBeInTheDocument();

		// hover on textarea for closing the emojiPicker
		const textArea = await screen.findByRole('textbox');
		user.hover(textArea);
		await waitFor(() => expect(emojiPicker).not.toBeInTheDocument());
	});

	test('Send message button status - initial status', () => {
		setup(<MessageComposer roomId={'roomId'} />);
		expect(screen.getByTestId('icon: Navigation2').parentNode).toBeDisabled();
	});

	test('Send message button status - spaces and text', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(screen.getByTestId('icon: Navigation2').parentNode).not.toBeDisabled();
	});

	test('Send message button status - only spaces', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, '     ');
		expect(screen.getByTestId('icon: Navigation2').parentNode).toBeDisabled();
	});

	test('Send a message', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		const sendButton = screen.getByTestId('icon: Navigation2');
		expect(sendButton).not.toBeDisabled();
		await user.click(sendButton);
		expect(textArea).toHaveValue('');
	});

	test('Send a message with attachment - image', async () => {
		mockedAddRoomAttachmentRequest.mockReturnValue('attachmentId');
		const testImageFile = new File(['hello'], 'hello.png', { type: 'image/png' });
		const { user } = storeSetupAdvanced();

		const input = screen.getByTestId('inputSelector') as HTMLInputElement;

		user.upload(input, testImageFile);
		await waitFor(() => expect(input.files).toHaveLength(1));

		const sendButton = screen.getByTestId('icon: Navigation2');
		await user.click(sendButton);

		const updatedStore = useStore.getState();
		expect(updatedStore.activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();
	});

	test('Send a message with attachment - pdf', async () => {
		mockedAddRoomAttachmentRequest.mockReturnValue('attachmentId');
		const testPdfFile = new File(['hello'], 'hello.pdf', { type: 'application/pdf' });
		const { user } = storeSetupAdvanced();

		const input = screen.getByTestId('inputSelector') as HTMLInputElement;

		user.upload(input, testPdfFile);
		await waitFor(() => expect(input.files).toHaveLength(1));

		const sendButton = screen.getByTestId('icon: Navigation2');
		await waitFor(() => user.click(sendButton));

		const updatedStore = useStore.getState();
		expect(updatedStore.activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();
	});

	test('Send a message with attachment - other extension', async () => {
		mockedAddRoomAttachmentRequest.mockReturnValue('attachmentId');
		const testFile = new File(['hello'], 'hello.xls', { type: 'application/ms-excel' });
		const { user } = storeSetupAdvanced();

		const input = screen.getByTestId('inputSelector') as HTMLInputElement;

		user.upload(input, testFile);
		await waitFor(() => expect(input.files).toHaveLength(1));

		const sendButton = screen.getByTestId('icon: Navigation2');
		await waitFor(() => user.click(sendButton));

		const updatedStore = useStore.getState();
		expect(updatedStore.activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();
	});

	test('Select file button', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const selectFileButton = screen.getByTestId('icon: Attach');
		expect(selectFileButton).toBeVisible();

		// Button status while user writes
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(selectFileButton).toBeVisible();
	});
	test('User type some text in the composer => text is displayed and button to send si enabled', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(screen.getByTestId('icon: Navigation2').parentNode).not.toBeDisabled();
		const textAreaUpdated = screen.getByRole('textbox');
		expect((textAreaUpdated as HTMLTextAreaElement).value).toBe(' hi! ');
	});
	test('User copy/paste some text in the text input', async () => {
		const { user } = storeSetupAdvanced();
		const textToPaste = 'some generic text';
		await user.paste(textToPaste);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(textToPaste);
		const uploadManager = screen.queryByTestId('upload_attachment_manager');
		expect(uploadManager).not.toBeInTheDocument();
	});
	test('input has text and user paste other text => text will be concatenated to the previous in the input', async () => {
		const { user } = storeSetupAdvanced();
		const initialText = 'we are gonna se';
		const textToPaste = 'some generic text';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		composerTextArea.focus();
		await user.paste(textToPaste);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(`${initialText}${textToPaste}`);
		const uploadManager = screen.queryByTestId('upload_attachment_manager');
		expect(uploadManager).not.toBeInTheDocument();
	});
	test('User copy/paste an image in the text input', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		storeSetupAdvanced();
		const composerTextArea = screen.getByRole('textbox');
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(1);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		const uploadManager = screen.queryByTestId('upload_attachment_manager');
		expect(uploadManager).toBeInTheDocument();
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('User copy/paste multiple images in the text input', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		storeSetupAdvanced();
		const composerTextArea = screen.getByRole('textbox');
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture, luigiPicture, peachPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe('');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(3);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		const uploadManager = screen.queryByTestId('upload_attachment_manager');
		expect(uploadManager).toBeInTheDocument();
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('input has text and user paste an image => upload manger will display the image selected with the input focused with the text', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'we are gonna se';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(1);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(initialText);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('input has text and user paste more images => upload manger will display the first image selected with the input focused with the text', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'we are gonna se';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture, luigiPicture, peachPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(3);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		const composer = await screen.findByTestId('textAreaComposer');
		expect((composer as HTMLTextAreaElement).value).toBe(initialText);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('test paste some text at the end of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'we are gonna see ';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.paste('later');
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('we are gonna see later');
	});
	test('test paste some text in the middle of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'we are gonna later';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(
			composerTextArea,
			`${initialText}{arrowleft}{arrowleft}{arrowleft}{arrowleft}{arrowleft}`
		);
		await user.paste('check ');
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('we are gonna check later');
	});
	test('test paste some text at the beginning of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Sam';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, `${initialText}{arrowleft}{arrowleft}{arrowleft}`);
		await user.paste('Hi ');
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('Hi Sam');
	});
	test('test paste single attachment at the beginning of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.type(composerTextArea, `{arrowleft}{arrowleft}`);
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('Hi');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(1);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('test paste single attachment at the end of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('Hi');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(1);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('test paste single attachment in the middle of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi Red';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.type(composerTextArea, `{arrowleft}{arrowleft}{arrowleft}`);
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('Hi Red');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(1);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('test paste more attachments at the beginning of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.type(composerTextArea, `{arrowleft}{arrowleft}`);
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture, luigiPicture, peachPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('Hi');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(3);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('test paste more attachments at the end of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture, luigiPicture, peachPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('Hi');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(3);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});
	test('test paste more attachments in the middle of the text present in the composer', async () => {
		const navigatorSetter = jest.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi Red';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.type(composerTextArea, `{arrowleft}{arrowleft}{arrowleft}`);
		const eventProperties = {
			clipboardData: {
				getData: jest.fn(),
				files: [marioPicture, luigiPicture, peachPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect((composerUpdated as HTMLTextAreaElement).value).toBe('Hi Red');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(3);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle('border-color: #8bc34a');
	});

	test('User can reply to a message attaching a file', async () => {
		const store = useStore.getState();

		// Set reply message
		store.setReferenceMessage(
			mockedRoom.id,
			'messageId',
			'senderId',
			'stanzaId',
			messageActionType.REPLY
		);

		setup(<MessageComposer roomId={mockedRoom.id} />);

		const attachFileButton = screen.getByTestId('icon: Attach');
		expect(attachFileButton).not.toHaveAttribute('disabled', true);

		const sendButton = screen.getByTestId('icon: Navigation2');
		expect(sendButton).not.toHaveAttribute('disabled', true);
	});

	test('The composer should have the draft message in the text area on opening the conversation', () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setDraftMessage(mockedRoom.id, false, "I'm a draft!");

		setup(<MessageComposer roomId={mockedRoom.id} />);

		const composerTextArea = screen.getByRole('textbox');
		expect((composerTextArea as HTMLTextAreaElement).value).toBe("I'm a draft!");
	});
});

describe('MessageComposer - isWriting events', () => {
	test('sendIsWriting is called immediately when user start writing', async () => {
		const { user } = setup(<MessageComposer roomId={mockedRoom.id} />);
		const composerTextArea = screen.getByRole('textbox');

		await user.type(composerTextArea, 'Hi');
		expect(mockedSendIsWriting).toBeCalledTimes(1);
	});

	test('sendIsWriting is called every 3 seconds', async () => {
		const { user } = setup(<MessageComposer roomId={mockedRoom.id} />);
		const composerTextArea = screen.getByRole('textbox');

		// User type for 5 seconds
		await user.type(composerTextArea, 'Hi');
		jest.advanceTimersByTime(500);
		await user.type(composerTextArea, '!');
		jest.advanceTimersByTime(500);
		await user.type(composerTextArea, ':)');
		jest.advanceTimersByTime(2000);
		await user.type(composerTextArea, 'How are you?');
		jest.advanceTimersByTime(2000);
		await user.type(composerTextArea, 'I am fine');
		expect(mockedSendIsWriting).toBeCalledTimes(2);
		jest.advanceTimersByTime(1000);
		expect(mockedSendIsWriting).toBeCalledTimes(3);
	});

	test('sendStopWriting is called after 3.5 seconds after user stops writing', async () => {
		const { user } = setup(<MessageComposer roomId={mockedRoom.id} />);
		const composerTextArea = screen.getByRole('textbox');

		await user.type(composerTextArea, 'Hi');
		jest.advanceTimersByTime(4000);
		expect(mockedSendPaused).toBeCalledTimes(1);
	});

	test('sendStopWriting is called immediately when user sends the message', async () => {
		const { user } = setup(<MessageComposer roomId={mockedRoom.id} />);
		const composerTextArea = screen.getByRole('textbox');

		await user.type(composerTextArea, 'Hi');
		const sendButton = screen.getByTestId('icon: Navigation2');
		await user.click(sendButton);
		expect(mockedSendPaused).toBeCalledTimes(1);
	});
});
