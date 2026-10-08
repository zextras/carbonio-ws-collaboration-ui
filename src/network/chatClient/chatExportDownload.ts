/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';

import { resolveChatExportName } from '../../utils/resolveChatExportName';

export function getChatExportUrl(roomId: string): string {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	const deletedPlaceholder = t('message.deletedMessage', 'Deleted message');
	const params = new URLSearchParams({ tz, deletedPlaceholder });
	return `${globalThis.document.location.origin}/services/chats/rooms/${roomId}/messages/export?${params.toString()}`;
}

export async function downloadChatExport(roomId: string): Promise<void> {
	// The room name can still be unresolved at click time (store.users hydrates
	// lazily): resolveChatExportName makes one last direct attempt before
	// falling back to the roomId, so naming isn't left to a stale snapshot.
	const fileName = await resolveChatExportName(roomId);
	const link = document.createElement('a');
	link.href = getChatExportUrl(roomId);
	// For a same-origin response the `download` attribute sets the saved filename,
	// overriding the server Content-Disposition, so naming stays on the FE.
	link.download = `${fileName}.txt`;
	document.body.appendChild(link);
	link.click();
	link.remove();
}
