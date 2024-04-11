/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import BubbleContextualMenuDropDown from './BubbleContextualMenuDropDown';
import useStore from '../../../../store/Store';
import {
	createMockCapabilityList,
	createMockRoom,
	createMockTextMessage
} from '../../../../tests/createMock';
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

const simpleMyTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	date: Date.now() - 6000
});

const repliedMyTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	replyTo: 'replyToId',
	date: Date.now() - 6000,
	repliedMessage: createMockTextMessage({ id: 'replyToId', roomId: mockedRoom.id })
});

const forwardedMyTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	from: mySessionId,
	date: Date.now() - 6000,
	forwarded: { id: 'forwardedId', date: 1661441294393, text: 'Forwarded text!', from: 'userId2' }
});

const attachmentMyTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	date: Date.now() - 6000,
	attachment: { id: 'id', name: 'file', mimeType: 'image/png', size: 122312 }
});

const myMessagesTypes: Array<[string, TextMessage]> = [
	['simple', simpleMyTextMessage],
	['replied', repliedMyTextMessage],
	['forwarded', forwardedMyTextMessage],
	['attachment', attachmentMyTextMessage]
];

const simpleTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	from: mySessionId,
	date: Date.now() - 6000
});

const repliedTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	from: mySessionId,
	date: Date.now() - 6000,
	replyTo: 'replyToId',
	repliedMessage: createMockTextMessage({ id: 'replyToId', roomId: mockedRoom.id })
});

const forwardedTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	from: mySessionId,
	date: Date.now() - 6000,
	forwarded: { id: 'forwardedId', date: 1661441294393, text: 'Forwarded text!' }
});

const attachmentTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	from: mySessionId,
	date: Date.now() - 60,
	attachment: { id: 'id', name: 'file', mimeType: 'image/png', size: 122312 }
});

const messageTypes: Array<[string, TextMessage]> = [
	['simple', simpleTextMessage],
	['replied', repliedTextMessage],
	['forwarded', forwardedTextMessage],
	['attachment', attachmentTextMessage]
];

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setSessionId(mySessionId);
	store.addRoom(mockedRoom);
	store.setCapabilities(createMockCapabilityList());
});

describe('Bubble Contextual Menu - other user messages', () => {
	test.each(messageTypes)('Test %s text message', async (msgType, msg) => {
		useStore.getState().newMessage(msg);
		const { user } = setup(<BubbleContextualMenuDropDown message={msg} isMyMessage={false} />);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const downloadAction = screen.queryByText(/Download/i);
		const previewAction = screen.queryByText(/Preview/i);

		const editAction = screen.queryByText(/Edit/i);
		const deleteForAllAction = screen.queryByText(/Delete for all/i);
		if (msg.attachment) {
			expect(editAction).not.toBeInTheDocument();
			expect(deleteForAllAction).not.toBeInTheDocument();
			expect(downloadAction).toBeInTheDocument();
			expect(previewAction).toBeInTheDocument();
		} else {
			expect(editAction).not.toBeInTheDocument();
			expect(deleteForAllAction).not.toBeInTheDocument();
			expect(downloadAction).not.toBeInTheDocument();
			expect(previewAction).not.toBeInTheDocument();
		}
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
	test.each(myMessagesTypes)('Test %s text message', async (msgType, msg) => {
		const { user } = setup(<BubbleContextualMenuDropDown message={msg} isMyMessage />);
		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const deleteForAllAction = screen.getByText(/Delete for all/i);
		expect(deleteForAllAction).toBeInTheDocument();

		if (msg.forwarded) {
			expect(screen.queryByText(/Edit/i)).not.toBeInTheDocument();
		} else {
			expect(screen.getByText(/Edit/i)).toBeInTheDocument();
		}

		const downloadAction = screen.queryByText(/Download/i);
		const previewAction = screen.queryByText(/Preview/i);
		if (msg.attachment) {
			expect(downloadAction).toBeInTheDocument();
			expect(previewAction).toBeInTheDocument();
		} else {
			expect(downloadAction).not.toBeInTheDocument();
			expect(previewAction).not.toBeInTheDocument();
		}
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
