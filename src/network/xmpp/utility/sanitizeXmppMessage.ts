/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-control-regex */
/**
 * Sanitizes an XMPP message by removing control characters that are not allowed in XML.
 * This is important to ensure that the message can be processed correctly by XMPP servers and clients.
 */
export function sanitizeXmppMessage(message: string): string {
	return message.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}
