/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import BubbleContextualMenuDropDown from './BubbleContextualMenuDropDown';
import useStore from '../../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { messageActionType } from '../../../../types/store/ActiveConversationTypes';
import { TextMessage } from '../../../../types/store/MessageTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const iconArrowIosDownward = 'icon: ArrowIosDownward';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP
});

const mySessionId = 'mySessionId';

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setSessionId(mySessionId);
	store.addRoom(mockedRoom);
});
describe('Bubble Contextual Menu - other user messages', () => {
	test('Simple text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({ roomId: mockedRoom.id });
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const editAction = screen.queryByText(/Edit/i);
		expect(editAction).not.toBeInTheDocument();
		const deleteForAllAction = screen.queryByText(/Delete for all/i);
		expect(deleteForAllAction).not.toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		expect(downloadAction).not.toBeInTheDocument();
		const previewAction = screen.queryByText(/Preview/i);
		expect(previewAction).not.toBeInTheDocument();
	});

	test('Replied text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			replyTo: 'replyToId',
			repliedMessage: createMockTextMessage({ id: 'replyToId', roomId: mockedRoom.id })
		});
		useStore.getState().newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const editAction = screen.queryByText(/Edit/i);
		expect(editAction).not.toBeInTheDocument();
		const deleteForAllAction = screen.queryByText(/Delete for all/i);
		expect(deleteForAllAction).not.toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		expect(downloadAction).not.toBeInTheDocument();
		const previewAction = screen.queryByText(/Preview/i);
		expect(previewAction).not.toBeInTheDocument();
	});

	test('Forwarded text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			forwarded: { id: 'forwardedId', date: 1661441294393, text: 'Forwarded text!' }
		});
		useStore.getState().newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const editAction = screen.queryByText(/Edit/i);
		expect(editAction).not.toBeInTheDocument();
		const deleteForAllAction = screen.queryByText(/Delete for all/i);
		expect(deleteForAllAction).not.toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		expect(downloadAction).not.toBeInTheDocument();
		const previewAction = screen.queryByText(/Preview/i);
		expect(previewAction).not.toBeInTheDocument();
	});

	test('Attachment text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			attachment: { id: 'id', name: 'file', mimeType: 'image/png', size: 122312 }
		});
		useStore.getState().newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const editAction = screen.queryByText(/Edit/i);
		expect(editAction).not.toBeInTheDocument();
		const deleteForAllAction = screen.queryByText(/Delete for all/i);
		expect(deleteForAllAction).not.toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		expect(downloadAction).toBeInTheDocument();
		const previewAction = screen.queryByText(/Preview/i);
		expect(previewAction).toBeInTheDocument();
	});

	test('If forward mode is active, the forward action should not be present', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({ roomId: mockedRoom.id });

		const store: RootStore = useStore.getState();
		store.newMessage(simpleTextMessage);
		store.setForwardMessageList(mockedRoom.id, simpleTextMessage);

		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		expect(screen.queryByText(/Forward/i)).not.toBeInTheDocument();
	});

	test('Reply a message after starting an edit should reset the input', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60
		});
		const store: RootStore = useStore.getState();
		store.newMessage(simpleTextMessage);
		store.setDraftMessage(simpleTextMessage.roomId, false, simpleTextMessage.text);
		store.setReferenceMessage(
			simpleTextMessage.roomId,
			simpleTextMessage.id,
			simpleTextMessage.from,
			simpleTextMessage.stanzaId,
			messageActionType.EDIT,
			simpleTextMessage.attachment
		);

		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		const replyAction = screen.getByText(/Reply/i);
		await user.click(replyAction);

		const { draftMessage } = useStore.getState().activeConversations[simpleTextMessage.roomId];
		expect(draftMessage).toBe('');
	});
});

describe('Bubble Contextual Menu - my messages', () => {
	test('Simple text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60
		});
		useStore.getState().newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const editAction = screen.queryByText(/Edit/i);
		expect(editAction).toBeInTheDocument();
		const deleteForAllAction = screen.getByText(/Delete for all/i);
		expect(deleteForAllAction).toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		expect(downloadAction).not.toBeInTheDocument();
		const previewAction = screen.queryByText(/Preview/i);
		expect(previewAction).not.toBeInTheDocument();
	});

	test('Replied text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60,
			replyTo: 'replyToId',
			repliedMessage: createMockTextMessage({ id: 'replyToId', roomId: mockedRoom.id })
		});
		useStore.getState().newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const editAction = screen.queryByText(/Edit/i);
		expect(editAction).toBeInTheDocument();
		const deleteForAllAction = screen.getByText(/Delete for all/i);
		expect(deleteForAllAction).toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		expect(downloadAction).not.toBeInTheDocument();
		const previewAction = screen.queryByText(/Preview/i);
		expect(previewAction).not.toBeInTheDocument();
	});

	test('Forwarded text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60,
			forwarded: { id: 'forwardedId', date: 1661441294393, text: 'Forwarded text!' }
		});
		useStore.getState().newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const editAction = screen.queryByText(/Edit/i);
		expect(editAction).not.toBeInTheDocument();
		const deleteForAllAction = screen.queryByTestId(/Delete for all/i);
		expect(deleteForAllAction).not.toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		expect(downloadAction).not.toBeInTheDocument();
		const previewAction = screen.queryByText(/Preview/i);
		expect(previewAction).not.toBeInTheDocument();
	});

	test('Attachment text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60,
			attachment: { id: 'id', name: 'file', mimeType: 'image/png', size: 122312 }
		});
		useStore.getState().newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const editAction = screen.queryByText(/Edit/i);
		expect(editAction).toBeInTheDocument();
		const deleteForAllAction = screen.queryByText(/Delete for all/i);
		expect(deleteForAllAction).toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		expect(downloadAction).toBeInTheDocument();
		const previewAction = screen.queryByText(/Preview/i);
		expect(previewAction).toBeInTheDocument();
	});

	test('if that message is being edited, the delete for all action should not be present', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60
		});
		const store: RootStore = useStore.getState();
		store.newMessage(simpleTextMessage);
		store.setDraftMessage(simpleTextMessage.roomId, false, simpleTextMessage.text);
		store.setReferenceMessage(
			simpleTextMessage.roomId,
			simpleTextMessage.id,
			simpleTextMessage.from,
			simpleTextMessage.stanzaId,
			messageActionType.EDIT,
			simpleTextMessage.attachment
		);

		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		expect(screen.queryByText(/Delete for all/i)).not.toBeInTheDocument();
	});

	test('if that message is being replied, the delete action should not be present', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60
		});
		const store: RootStore = useStore.getState();
		store.newMessage(simpleTextMessage);
		store.setDraftMessage(simpleTextMessage.roomId, false, simpleTextMessage.text);
		store.setReferenceMessage(
			simpleTextMessage.roomId,
			simpleTextMessage.id,
			simpleTextMessage.from,
			simpleTextMessage.stanzaId,
			messageActionType.REPLY,
			simpleTextMessage.attachment
		);

		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		expect(screen.queryByText(/Delete for all/i)).not.toBeInTheDocument();
	});

	test('if forward mode is active, the forward action should not be present', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60
		});
		const store: RootStore = useStore.getState();
		store.newMessage(simpleTextMessage);
		store.setForwardMessageList(mockedRoom.id, simpleTextMessage);

		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		expect(screen.queryByText(/Forward/i)).not.toBeInTheDocument();
	});
});
