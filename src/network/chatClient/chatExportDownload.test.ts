/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { downloadChatExport, getChatExportUrl } from './chatExportDownload';
import { resolveChatExportName } from '../../utils/resolveChatExportName';

vi.mock('../../utils/resolveChatExportName');

describe('chatExportDownload', () => {
	beforeEach(() => {
		vi.mocked(resolveChatExportName).mockReset();
	});

	test('getChatExportUrl builds the same-origin URL with tz and deletedPlaceholder', () => {
		// Pin the zone so the URL does not depend on the host running the tests (CI is in UTC).
		// The fake timers replace Intl.DateTimeFormat, so spying on its prototype has no effect
		const formatter = Intl.DateTimeFormat();
		const options = formatter.resolvedOptions();
		vi.spyOn(formatter, 'resolvedOptions').mockReturnValue({ ...options, timeZone: 'Europe/Rome' });
		vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue(formatter);
		// The label rides the same i18n key the v1 client-side formatter used
		// (message.deletedMessage)
		const url = getChatExportUrl('room-1');
		expect(url).toBe(
			`${window.document.location.origin}/services/chats/rooms/room-1/messages/export?tz=Europe%2FRome&deletedPlaceholder=Deleted+message`
		);
	});

	test('downloadChatExport triggers a native download with the resolved filename', async () => {
		vi.mocked(resolveChatExportName).mockResolvedValue('My Chat');
		const click = vi.fn();
		const remove = vi.fn();
		const link = { href: '', download: '', click, remove } as unknown as HTMLAnchorElement;
		vi.spyOn(document, 'createElement').mockReturnValue(link);
		const append = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);

		await downloadChatExport('room-1');

		expect(resolveChatExportName).toHaveBeenCalledWith('room-1');
		expect(link.href).toContain('/services/chats/rooms/room-1/messages/export');
		expect(link.download).toBe('My Chat.txt');
		expect(click).toHaveBeenCalledTimes(1);
		expect(append).toHaveBeenCalledWith(link);
		expect(remove).toHaveBeenCalledTimes(1);
	});
});
