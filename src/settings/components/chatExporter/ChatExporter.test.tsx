/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import ChatExporter from './ChatExporter';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomType } from '../../../types/network/models/roomBeTypes';
import ChatApi from '../../../network/apis/ChatApi';

const roomId = 'roomId';

const groupRoom = createMockRoom({
	id: roomId,
	type: RoomType.GROUP
});

beforeEach(() => {
	useStore.getState().addRooms([groupRoom]);
});

describe('ChatExporter tests', () => {
	test('Initialize ChatExporter loads history via REST API', async () => {
		const spyOnGetMessageHistory = jest
			.spyOn(ChatApi, 'getMessageHistory')
			.mockResolvedValue([]);

		const chatExporter = new ChatExporter(roomId);
		expect(chatExporter).toBeDefined();

		// Wait for async initialization
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(spyOnGetMessageHistory).toHaveBeenCalledWith(roomId, undefined, 100);
	});

	test('Export history when history is complete', async () => {
		jest.spyOn(ChatApi, 'getMessageHistory').mockResolvedValue([]);

		const chatExporter = new ChatExporter(roomId);
		const message = createMockTextMessage();
		chatExporter.addMessagesToFullHistory([message]);
		const message2 = createMockTextMessage({
			attachment: { id: 'file', name: 'File.txt', mimeType: 'txt', size: 2300 }
		});
		chatExporter.addMessagesToFullHistory([message2]);
		const message3 = createMockTextMessage({ deleted: true });
		chatExporter.addMessagesToFullHistory([message3]);

		document.body.appendChild = jest.fn();
		document.body.removeChild = jest.fn();
		URL.createObjectURL = jest.fn().mockReturnValue('blob:url');

		chatExporter.exportHistory();

		expect(document.body.appendChild).toHaveBeenCalled();
		expect(document.body.removeChild).toHaveBeenCalled();
	});

	test('Continue exporting loads more history', async () => {
		const messages = [createMockTextMessage({ date: Date.now() })];
		const spyOnGetMessageHistory = jest
			.spyOn(ChatApi, 'getMessageHistory')
			.mockResolvedValueOnce(messages)
			.mockResolvedValueOnce([]);

		const chatExporter = new ChatExporter(roomId);

		// Wait for initial load
		await new Promise((resolve) => setTimeout(resolve, 0));

		// Set up mocks for export
		document.body.appendChild = jest.fn();
		document.body.removeChild = jest.fn();
		URL.createObjectURL = jest.fn().mockReturnValue('blob:url');

		await chatExporter.continueExporting();

		expect(spyOnGetMessageHistory).toHaveBeenCalledTimes(2);
	});
});
