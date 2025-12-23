/* eslint-disable testing-library/prefer-user-event */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, createEvent, fireEvent, screen, waitFor } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import ConversationFooter from './ConversationFooter';
import attachmentsApi from '../../../../network/apis/AttachmentsApi';
import roomsApi from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockFile,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { FileToUpload, messageActionType } from '../../../../types/store/ActiveConversationTypes';
import { Message } from '../../../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { User, UserType } from '../../../../types/store/UserTypes';
import { now } from '../../../../utils/dateUtils';

const iconNavigator2 = 'icon: Navigation2';
const borderColor = 'border-color: #8bc34a';
const initText = 'we are gonna se';
const iconAttach = 'icon: Attach';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

const guestUser: User = createMockUser({ type: UserType.GUEST });

const mockedRoomTemporary: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: guestUser.id })
	]
});

const mockedMessage: Message = createMockTextMessage({
	from: 'idPaolo',
	roomId: mockedRoom.id,
	date: now() - 1
});

const otherMockedMessage: Message = createMockTextMessage({
	from: 'idPaolo',
	roomId: mockedRoom.id,
	date: Date.now(),
	text: 'Hi 2'
});

const storeSetupAdvanced = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);
	return { user, store };
};

const storeSetupGroup = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setAttributes(createMockAttributesList({ carbonioWscMessageEditTimeLimit: '5m' }));
	store.newMessage(mockedMessage);
	const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);
	return { user, store };
};

const marioPicture = createMockFile({ name: 'Mario', options: { type: 'image/png' } });
const luigiPicture = createMockFile({ name: 'Luigi', options: { type: 'image/png' } });
const peachPicture = createMockFile({ name: 'Peach', options: { type: 'image/png' } });

const draftMessage = 'I am a draft message';

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('idPaolo', 'Paolo');
	store.addRooms([mockedRoom]);
});

describe('ConversationFooter', () => {
	test('Open/close emoji picker by hovering it', async () => {
		const { user } = setup(<ConversationFooter roomId={'roomId'} />);

		// Initial state
		expect(screen.queryByTestId('emojiPicker')).not.toBeInTheDocument();

		// hover on emoji button
		const emojiButton = screen.getAllByRole('button')[0];
		await user.hover(emojiButton);
		const emojiPicker = await screen.findByTestId('emojiPicker');
		expect(emojiPicker).toBeInTheDocument();

		// hover on emojiPicker
		await user.hover(emojiPicker);
		expect(emojiPicker).toBeInTheDocument();

		// hover on textarea for closing the emojiPicker
		const textArea = await screen.findByRole('textbox');
		await user.hover(textArea);
		await waitFor(() => expect(emojiPicker).not.toBeInTheDocument());
	});

	test('Send message button status - initial status', () => {
		setup(<ConversationFooter roomId={'roomId'} />);
		expect(screen.getByTestId(iconNavigator2).parentNode).toBeDisabled();
	});

	test('Send message button status - spaces and text', async () => {
		const { user } = setup(<ConversationFooter roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(screen.getByTestId(iconNavigator2).parentNode).not.toBeDisabled();
	});

	test('Send message button status - only spaces', async () => {
		const { user } = setup(<ConversationFooter roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, '     ');
		expect(screen.getByTestId(iconNavigator2).parentNode).toBeDisabled();
	});

	test('Select file button', async () => {
		const { user } = setup(<ConversationFooter roomId={'roomId'} />);
		const selectFileButton = screen.getByTestId(iconAttach);
		expect(selectFileButton).toBeVisible();

		// Button status while user writes
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(selectFileButton).toBeVisible();
	});

	test('User type some text in the composer => text is displayed and button to send si enabled', async () => {
		const { user } = setup(<ConversationFooter roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(screen.getByTestId(iconNavigator2).parentNode).not.toBeDisabled();
		const textAreaUpdated = screen.getByRole('textbox');
		expect(textAreaUpdated as HTMLTextAreaElement).toHaveValue(' hi! ');
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
		const initialText = initText;
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
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		storeSetupAdvanced();
		const composerTextArea = screen.getByRole('textbox');
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
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
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('User copy/paste multiple images in the text input', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		storeSetupAdvanced();
		const composerTextArea = screen.getByRole('textbox');
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
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
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('input has text and user paste an image => upload manger will display the image selected with the input focused with the text', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = initText;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
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
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('input has text and user paste more images => upload manger will display the first image selected with the input focused with the text', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = initText;
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
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
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('User can reply to a message attaching a file', async () => {
		const store = useStore.getState();
		// Set reply message
		const originalMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: 'senderId',
			id: 'messageId'
		});
		store.newMessage(originalMessage);
		store.setReferenceMessage(mockedRoom.id, {
			messageId: originalMessage.id,
			senderId: originalMessage.from,
			stanzaId: originalMessage.stanzaId,
			actionType: messageActionType.REPLY
		});

		setup(<ConversationFooter roomId={mockedRoom.id} />);

		const attachFileButton = screen.getByTestId('icon: Attach');
		expect(attachFileButton).toBeEnabled();

		const sendButton = screen.getByTestId(iconNavigator2);
		expect(sendButton).toBeEnabled();
	});

	test('User can reply to a message with a message and send it', async () => {
		const store = useStore.getState();
		const spySendChatMessageReply = vi.spyOn(store.connections.xmppClient, 'sendChatMessageReply');
		const textToSend = 'hi!';
		store.updateHistory(mockedRoom.id, [mockedMessage]);

		// Set reply message
		store.setReferenceMessage(mockedRoom.id, {
			messageId: mockedMessage.id,
			senderId: mockedMessage.from,
			stanzaId: mockedMessage.stanzaId,
			actionType: messageActionType.REPLY
		});
		const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);

		const textArea = screen.getByRole('textbox');
		await user.type(textArea, textToSend);
		const sendButton = screen.getByTestId(iconNavigator2);
		await user.click(sendButton);
		await waitFor(() => expect(spySendChatMessageReply).toHaveBeenCalled());
	});

	test('User can edit a message and send it', async () => {
		const spySendChatMessageEdit = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'sendChatMessageEdit'
		);
		const store = useStore.getState();
		store.updateHistory(mockedRoom.id, [mockedMessage]);

		// Set reply message
		store.setReferenceMessage(mockedRoom.id, {
			messageId: mockedMessage.id,
			senderId: mockedMessage.from,
			stanzaId: mockedMessage.stanzaId,
			actionType: messageActionType.EDIT
		});

		const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);

		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		const sendButton = screen.getByTestId(iconNavigator2);
		await user.click(sendButton);

		await waitFor(() => expect(spySendChatMessageEdit).toHaveBeenCalled());
	});

	test('User can edit a message and send it as empty to trigger delete modal message', async () => {
		const store = useStore.getState();
		store.updateHistory(mockedRoom.id, [mockedMessage]);

		// Set reply message
		store.setReferenceMessage(mockedRoom.id, {
			messageId: mockedMessage.id,
			senderId: mockedMessage.from,
			stanzaId: mockedMessage.stanzaId,
			actionType: messageActionType.EDIT
		});

		const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);

		const textArea = screen.getByRole('textbox');
		await user.clear(textArea);
		const sendButton = screen.getByTestId(iconNavigator2);
		await user.click(sendButton);

		const deleteModalTitle = await screen.findByText(`Delete selected message?`);
		expect(deleteModalTitle).toBeInTheDocument();
	});
});

describe('Send message', () => {
	test('Send a message', async () => {
		const { user } = setup(<ConversationFooter roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		const sendButton = screen.getByTestId(iconNavigator2);
		expect(sendButton).not.toBeDisabled();
		await user.click(sendButton);
		expect(textArea).toHaveValue('');
	});

	test('Send a message with attachment - image', async () => {
		const spyOnAddRoomAttachment = vi.spyOn(roomsApi, 'addRoomAttachment');
		const spyOnGetImageSize = vi.spyOn(attachmentsApi, 'getImageSize');
		spyOnGetImageSize.mockImplementation(() => Promise.resolve({ width: 10, height: 10 }));

		const testImageFile = new File(['hello'], 'hello.png', { type: 'image/png' });
		const { user } = storeSetupAdvanced();

		const input = screen.getByTestId('inputSelector') as HTMLInputElement;

		await user.upload(input, testImageFile);
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toHaveLength(1);

		const sendButton = screen.getByTestId(iconNavigator2);
		await user.click(sendButton);

		await waitFor(() => {
			expect(spyOnGetImageSize).toHaveBeenCalledTimes(1);
			expect(spyOnAddRoomAttachment).toHaveBeenCalled();
		});
		const updatedStore = useStore.getState();
		expect(updatedStore.activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();
	});

	test('Send a message with attachment - pdf', async () => {
		const spyOnAddRoomAttachment = vi.spyOn(roomsApi, 'addRoomAttachment');
		const testPdfFile = new File(['hello'], 'hello.pdf', { type: 'application/pdf' });
		const { user } = storeSetupAdvanced();

		const input = screen.getByTestId('inputSelector') as HTMLInputElement;

		await user.upload(input, testPdfFile);
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toHaveLength(1);

		const sendButton = screen.getByTestId(iconNavigator2);
		await user.click(sendButton);

		await waitFor(() => {
			expect(spyOnAddRoomAttachment).toHaveBeenCalledTimes(1);
		});
		const updatedStore = useStore.getState();
		expect(updatedStore.activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();
	});

	test('Send a message with attachment - other extension', async () => {
		const spyOnAddRoomAttachment = vi.spyOn(roomsApi, 'addRoomAttachment');
		const testFile = new File(['hello'], 'hello.xls', { type: 'application/ms-excel' });
		const { user } = storeSetupAdvanced();

		const input = screen.getByTestId('inputSelector') as HTMLInputElement;

		await user.upload(input, testFile);
		expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toHaveLength(1);

		const sendButton = screen.getByTestId(iconNavigator2);
		await user.click(sendButton);

		await waitFor(() => {
			expect(spyOnAddRoomAttachment).toHaveBeenCalledTimes(1);
		});
		const updatedStore = useStore.getState();
		expect(updatedStore.activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();
	});

	test("attachment selector shouldn't be present if the user is a guest", () => {
		const store = useStore.getState();
		store.addRooms([mockedRoomTemporary]);
		store.setLoginInfo(guestUser.id, guestUser.name, guestUser.type);
		store.setUserInfo([guestUser]);
		setup(<ConversationFooter roomId={mockedRoom.id} />);

		expect(screen.queryByTestId(iconAttach)).not.toBeInTheDocument();
	});

	test('File description is preserved in input when upload failed', async () => {
		useStore
			.getState()
			.setAttributes(createMockAttributesList({ carbonioWscMaxAttachmentSize: '1' }));

		const size = 1024 * 1024 * 2;
		const blob = new ArrayBuffer(size);
		const file = new File([blob], 'test.bin', { type: 'application/octet-stream' });

		const { user } = storeSetupAdvanced();
		const composerTextArea = await screen.findByTestId('textAreaComposer');
		await user.type(composerTextArea, 'text');

		const inputFile = screen.getByTestId('inputSelector') as HTMLInputElement;
		await user.upload(inputFile, file);
		const filesToAttach = useStore.getState().activeConversations[mockedRoom.id]?.filesToAttach;
		expect(filesToAttach).toHaveLength(1);

		const filePreview = await screen.findByTestId(
			`previewFileUpload-${file.name}-${filesToAttach?.[0].fileId}`
		);
		await user.click(filePreview);
		const storedFile = useStore.getState().activeConversations[mockedRoom.id].filesToAttach?.[0];
		expect(storedFile?.description).toBe('text');

		const sendButton = screen.getByTestId(iconNavigator2);
		await user.click(sendButton);

		const updatedStore = useStore.getState();
		expect(updatedStore.activeConversations[mockedRoom.id].filesToAttach).toBeUndefined();

		await waitFor(() => {
			expect(screen.getByTestId('textAreaComposer')).toHaveValue('text');
		});
	});
});

describe('Paste on textbox', () => {
	test('Paste some text at the end of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'we are gonna see ';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.paste('later');
		const composerUpdated = screen.getByRole('textbox');
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('we are gonna see later');
	});

	test('Paste some text in the middle of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
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
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('we are gonna check later');
	});

	test('Paste some text at the beginning of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Sam';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, `${initialText}{arrowleft}{arrowleft}{arrowleft}`);
		await user.paste('Hi ');
		const composerUpdated = screen.getByRole('textbox');
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('Hi Sam');
	});

	test('Paste single attachment at the beginning of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.type(composerTextArea, `{arrowleft}{arrowleft}`);
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
				files: [marioPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('Hi');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(1);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('Paste single attachment at the end of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
				files: [marioPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('Hi');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(1);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('Paste single attachment in the middle of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi Red';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.type(composerTextArea, `{arrowleft}{arrowleft}{arrowleft}`);
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
				files: [marioPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('Hi Red');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(1);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('Paste more attachments at the beginning of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.type(composerTextArea, `{arrowleft}{arrowleft}`);
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
				files: [marioPicture, luigiPicture, peachPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('Hi');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(3);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('Paste more attachments at the end of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
				files: [marioPicture, luigiPicture, peachPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('Hi');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(3);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle(borderColor);
	});

	test('Paste more attachments in the middle of the text present in the composer', async () => {
		const navigatorSetter = vi.spyOn(navigator, 'platform', 'get');
		navigatorSetter.mockReturnValue('MacIntel');
		const { user } = storeSetupAdvanced();
		const initialText = 'Hi Red';
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, initialText);
		await user.type(composerTextArea, `{arrowleft}{arrowleft}{arrowleft}`);
		const eventProperties = {
			clipboardData: {
				getData: vi.fn(),
				files: [marioPicture, luigiPicture, peachPicture]
			}
		};
		const pasteEvent = createEvent.paste(composerTextArea, eventProperties);
		fireEvent(composerTextArea, pasteEvent);
		const composerUpdated = screen.getByRole('textbox');
		expect(composerUpdated as HTMLTextAreaElement).toHaveValue('Hi Red');
		const updatedStore = useStore.getState();
		const { filesToAttach } = updatedStore.activeConversations[mockedRoom.id];
		expect(filesToAttach?.length).toBe(3);
		const imageCopied = await screen.findByTestId(
			`previewImage-${(filesToAttach as FileToUpload[])[0].file.name}-${
				(filesToAttach as FileToUpload[])[0].fileId
			}`
		);
		expect(imageCopied).toBeInTheDocument();
		expect(imageCopied).toHaveStyle(borderColor);
	});
});

describe('MessageComposer - isWriting events', () => {
	test('sendIsWriting is called immediately when user start writing', async () => {
		const spySendIsWriting = vi.spyOn(useStore.getState().connections.xmppClient, 'sendIsWriting');
		const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);
		const composerTextArea = screen.getByRole('textbox');
		await user.type(composerTextArea, 'Hi');
		expect(spySendIsWriting).toHaveBeenCalled();
	});

	test('sendIsWriting is called every 3 seconds', async () => {
		const spySendIsWriting = vi.spyOn(useStore.getState().connections.xmppClient, 'sendIsWriting');
		const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);
		const composerTextArea = screen.getByRole('textbox');

		// User type for 5 seconds
		await user.type(composerTextArea, 'Hi');
		vi.advanceTimersByTime(500);
		await user.type(composerTextArea, '!');
		vi.advanceTimersByTime(500);
		await user.type(composerTextArea, ':)');
		vi.advanceTimersByTime(2000);
		await user.type(composerTextArea, 'How are you?');
		vi.advanceTimersByTime(2000);
		await user.type(composerTextArea, 'I am fine');
		expect(spySendIsWriting).toHaveBeenCalledTimes(2);
		vi.advanceTimersByTime(1000);
		expect(spySendIsWriting).toHaveBeenCalledTimes(3);
	});

	test('sendStopWriting is called after 3.5 seconds after user stops writing', async () => {
		const spySendPaused = vi.spyOn(useStore.getState().connections.xmppClient, 'sendPaused');

		const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);
		const composerTextArea = screen.getByRole('textbox');

		await user.type(composerTextArea, 'Hi');
		vi.advanceTimersByTime(4000);
		expect(spySendPaused).toHaveBeenCalledTimes(1);
	});

	test('sendStopWriting is called immediately when user sends the message', async () => {
		const spySendPaused = vi.spyOn(useStore.getState().connections.xmppClient, 'sendPaused');
		const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);
		const composerTextArea = screen.getByRole('textbox');

		await user.type(composerTextArea, 'Hi');
		const sendButton = screen.getByTestId(iconNavigator2);
		await user.click(sendButton);
		expect(spySendPaused).toHaveBeenCalledTimes(1);
	});
});

describe('Draft message', () => {
	test('The composer should have the draft message in the text area on opening the conversation', () => {
		const store = useStore.getState();
		store.setDraftMessage(mockedRoom.id, draftMessage);

		setup(<ConversationFooter roomId={mockedRoom.id} />);

		const composerTextArea = screen.getByRole('textbox');
		expect(composerTextArea as HTMLTextAreaElement).toHaveValue(draftMessage);
	});

	test('The cursor position is in the end of the draft message on opening the conversation', async () => {
		const store = useStore.getState();
		store.setDraftMessage(mockedRoom.id, draftMessage);

		const { rerender } = setup(<ConversationFooter roomId="anotherRoomId" />);
		rerender(<ConversationFooter roomId={mockedRoom.id} />);

		const composerTextArea = screen.getByRole('textbox');
		expect((composerTextArea as HTMLTextAreaElement).selectionStart).toBe(draftMessage.length);
	});

	test('ArrowUp triggers edit when last message is sent by me', async () => {
		const { user } = storeSetupGroup();
		await user.keyboard('{ArrowUp}');

		const composerTextArea = screen.getByRole('textbox');
		await waitFor(() =>
			expect((composerTextArea as HTMLTextAreaElement).selectionStart).toBe(
				mockedMessage.text.length
			)
		);
		await waitFor(() => expect((composerTextArea as HTMLTextAreaElement).value).toBe('Hi'));
	});

	test('ArrowUp do not triggers edit when last message is not mine', async () => {
		const { user, store } = storeSetupGroup();

		const messageByRoberto: Message = createMockTextMessage({
			from: 'idRoberto',
			roomId: mockedRoom.id,
			date: Date.now()
		});
		act(() => store.newMessage(messageByRoberto));

		await user.keyboard('{ArrowUp}');

		const composerTextArea = screen.getByRole('textbox');
		await waitFor(() => expect((composerTextArea as HTMLTextAreaElement).value).toBe(''));
	});
});

describe('Forward footer', () => {
	test('adding a message to the forward list triggers the footer', async () => {
		const store = useStore.getState();
		store.newMessage(mockedMessage);

		setup(<ConversationFooter roomId={mockedRoom.id} />);

		act(() => {
			store.setForwardMessageList(mockedRoom.id, mockedMessage);
		});

		const forwardButton = await screen.findByRole('button', { name: 'Forward' });
		expect(forwardButton).toBeInTheDocument();
	});

	test('adding more than a message to the forward list triggers the footer with the updated label', async () => {
		const store = useStore.getState();
		store.newMessage(mockedMessage);
		store.newMessage(otherMockedMessage);
		store.setForwardMessageList(mockedRoom.id, mockedMessage);
		setup(<ConversationFooter roomId={mockedRoom.id} />);

		act(() => {
			store.setForwardMessageList(mockedRoom.id, otherMockedMessage);
		});

		const forwardButton = await screen.findByRole('button', { name: 'forward 2 messages' });
		expect(forwardButton).toBeInTheDocument();
	});

	test('clicking the exit button restore the normal composer', async () => {
		const store = useStore.getState();
		store.newMessage(mockedMessage);
		store.newMessage(otherMockedMessage);
		store.setForwardMessageList(mockedRoom.id, mockedMessage);
		store.setForwardMessageList(mockedRoom.id, otherMockedMessage);
		const { user } = setup(<ConversationFooter roomId={mockedRoom.id} />);

		const exitButton = await screen.findByRole('button', { name: 'Exit Selection Mode' });
		expect(exitButton).toBeInTheDocument();

		await user.click(exitButton);

		expect(screen.queryByRole('button', { name: 'Exit Selection Mode' })).not.toBeInTheDocument();
	});
});
