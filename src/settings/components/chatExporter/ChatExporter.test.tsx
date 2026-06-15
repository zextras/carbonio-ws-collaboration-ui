/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import ChatExporter from './ChatExporter';
import { getIsMongooseIM } from '../../../store/selectors/ConnectionSelector';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomType } from '../../../types/network/models/roomBeTypes';

vi.mock('../../../store/selectors/ConnectionSelector', () => ({
	getIsMongooseIM: vi.fn()
}));

const roomId = 'roomId';

const groupRoom = createMockRoom({
	id: roomId,
	type: RoomType.GROUP
});

beforeEach(() => {
	useStore.getState().addRooms([groupRoom]);
});

describe('ChatExporter tests', () => {
	test('Initialize ChatExporter creates an instance', () => {
		(getIsMongooseIM as ReturnType<typeof vi.fn>).mockReturnValue(true);
		const chatExporter = new ChatExporter(roomId);
		expect(chatExporter).toBeDefined();
	});

	test('Request more history when history is not complete', () => {
		(getIsMongooseIM as ReturnType<typeof vi.fn>).mockReturnValue(true);
		const chatExporter = new ChatExporter(roomId);
		const message = createMockTextMessage({ date: Date.now() });

		chatExporter.addMessagesToFullHistory([message]);
		chatExporter.continueExporting();
	});

	test('Export history when history is complete', () => {
		(getIsMongooseIM as ReturnType<typeof vi.fn>).mockReturnValue(true);
		const chatExporter = new ChatExporter(roomId);
		const message = createMockTextMessage();
		chatExporter.addMessagesToFullHistory([message]);
		const message2 = createMockTextMessage({
			attachment: { id: 'file', name: 'File.txt', mimeType: 'txt', size: 2300 }
		});
		chatExporter.addMessagesToFullHistory([message2]);
		const message3 = createMockTextMessage({ deleted: true });
		chatExporter.addMessagesToFullHistory([message3]);

		document.body.appendChild = vi.fn();
		document.body.removeChild = vi.fn();
		URL.createObjectURL = vi.fn().mockReturnValue('blob:url');

		chatExporter.exportHistory();

		expect(document.body.appendChild).toHaveBeenCalled();
		expect(document.body.removeChild).toHaveBeenCalled();
	});
});
