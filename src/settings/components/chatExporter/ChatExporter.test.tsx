/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import ChatExporter from './ChatExporter';
import { createMockTextMessage } from '../../../tests/createMock';
import { mockedRequestFullHistory } from '../../../tests/mockedXmppClient';

describe('ChatExporter tests', () => {
	test('Initialize ChatExporter sends a full history request', () => {
		const roomId = 'roomId';
		const chatExporter = new ChatExporter(roomId);
		expect(chatExporter).toBeDefined();
		expect(mockedRequestFullHistory).toHaveBeenCalledWith(roomId);
	});

	test('Request more history when history is not complete', () => {
		const roomId = 'roomId';
		const chatExporter = new ChatExporter(roomId);
		const message = createMockTextMessage({ date: Date.now() });

		chatExporter.addMessageToFullHistory(message);
		chatExporter.handleFullHistoryResponse(false);

		expect(mockedRequestFullHistory).toHaveBeenCalledWith(roomId, message.date);
	});

	test('Export history when history is complete', () => {
		const roomId = 'roomId';
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
