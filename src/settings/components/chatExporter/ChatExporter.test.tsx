/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import ChatExporter from './ChatExporter';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';

const roomId = 'roomId';
const groupRoom: RoomBe = createMockRoom({
	id: roomId,
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: false }
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRoom(groupRoom);
});

describe('ChatExporter tests', () => {
	test('Initialize ChatExporter sends a full history request', () => {
		const spyOnRequestFullHistory = jest.spyOn(
			useStore.getState().connections.xmppClient,
			'requestFullHistory'
		);
		const chatExporter = new ChatExporter(roomId);
		expect(chatExporter).toBeDefined();
		expect(spyOnRequestFullHistory).toHaveBeenCalledWith(roomId);
	});

	test('Request more history when history is not complete', () => {
		const spyOnRequestFullHistory = jest.spyOn(
			useStore.getState().connections.xmppClient,
			'requestFullHistory'
		);
		const chatExporter = new ChatExporter(roomId);
		const message = createMockTextMessage({ date: Date.now() });

		chatExporter.addMessageToFullHistory(message);
		chatExporter.handleFullHistoryResponse(false);

		expect(spyOnRequestFullHistory).toHaveBeenCalledWith(roomId, message.date);
	});

	test('Export history when history is complete', () => {
		const chatExporter = new ChatExporter(roomId);
		const message = createMockTextMessage();
		chatExporter.addMessageToFullHistory(message);
		const message2 = createMockTextMessage({ attachment: { name: 'File.txt' } });
		chatExporter.addMessageToFullHistory(message2);
		const message3 = createMockTextMessage({ deleted: true });
		chatExporter.addMessageToFullHistory(message3);

		document.body.appendChild = jest.fn();
		document.body.removeChild = jest.fn();
		URL.createObjectURL = jest.fn().mockReturnValue('blob:url');

		chatExporter.handleFullHistoryResponse(true);

		expect(document.body.appendChild).toHaveBeenCalled();
		expect(document.body.removeChild).toHaveBeenCalled();
	});
});
