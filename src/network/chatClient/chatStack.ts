/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The stack the chat is running on, SDK or XMPP. It is not the negotiated version: a REST call
// answered with a 422 realigns the version before the events socket reopens and swaps the stack.
let runningOnWscPure: boolean | undefined;

export function markChatStack(isPure: boolean): void {
	runningOnWscPure = isPure;
}

export function isChatStackWscPure(): boolean | undefined {
	return runningOnWscPure;
}
