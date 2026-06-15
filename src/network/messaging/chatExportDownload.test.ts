/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getChatExportUrl, downloadChatExport } from './chatExportDownload';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	t: (_key: string, fallback: string): string => fallback
}));

describe('chatExportDownload', () => {
	beforeAll(() => {
		vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
			resolvedOptions: () => ({ timeZone: 'Europe/Rome' })
		} as never);
	});

	test('getChatExportUrl builds the same-origin URL with tz and deletedPlaceholder', () => {
		const url = getChatExportUrl('room-1');
		expect(url).toBe(
			`${window.document.location.origin}/services/chats/rooms/room-1/messages/export?tz=Europe%2FRome&deletedPlaceholder=Deleted+message`
		);
	});

	test('downloadChatExport triggers a native download with the .txt filename', () => {
		const click = vi.fn();
		const link = { href: '', download: '', click } as unknown as HTMLAnchorElement;
		vi.spyOn(document, 'createElement').mockReturnValue(link);
		const append = vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);
		const remove = vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n);

		downloadChatExport('room-1', 'My Chat');

		expect(link.href).toContain('/services/chats/rooms/room-1/messages/export');
		expect(link.download).toBe('My Chat.txt');
		expect(click).toHaveBeenCalledTimes(1);
		expect(append).toHaveBeenCalledWith(link);
		expect(remove).toHaveBeenCalledWith(link);
	});
});
