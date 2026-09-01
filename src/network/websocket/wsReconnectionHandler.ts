/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { getToken } from '../apis/InfoApi';
import { isWscPure } from '../chatClient/ChatClient';
import { wscSdk } from '../sdk/wscSdk';
import { xmppClient } from '../xmpp/XMPPClient';

/**
 * Chat state refresh after a gap in the events channel (socket reconnection,
 * MessageBrokerRestored): the v1 parity of the strophe `connectionEstablish`
 * on reconnection — reset the volatile chat data and re-request everything
 * from the inbox; the open conversation reloads reactively off the emptied
 * registry, presence and read markers ride the same response. WSC-pure only:
 * on 1.6.x the events lost in the gap are XMPP's business and strophe already
 * runs this exact routine on its own reconnection.
 */
export function catchUpChatState(): void {
	if (!isWscPure()) {
		return;
	}
	useStore.getState().resetXmppData();
	wscSdk.fetchInbox().catch((err) => {
		console.error('catchUpChatState: inbox refresh failed', err);
	});
}

/**
 * Chat lifecycle on an events-socket RE-connection. `wasPure` is the gate
 * value before `_onOpen` realigned the version from the negotiated
 * sub-protocol: when they differ, the backend changed major under a live
 * session (deploy/rollback) and the chat stack must be swapped at runtime.
 *
 * - still WSC-pure → plain catch-up (reset + inbox refresh);
 * - flip to WSC-pure → same, plus the strophe stack is deliberately torn down
 *   (MongooseIM is gone: its reconnection loop would spin forever) and the
 *   legacy health flag is parked healthy like `chatClient.connect` does;
 * - flip back to 1.6.x → reset the v2-shaped data and boot the XMPP stack,
 *   whose CONNECTED init re-requests inbox/roster/features (the full v1 boot);
 * - still 1.6.x → nothing: strophe owns its own reconnection lifecycle (v1
 *   parity — the events socket never drove chat data on 1.6.x).
 */
export function handleChatReconnection(wasPure: boolean): void {
	if (isWscPure()) {
		if (!wasPure) {
			xmppClient.disconnect();
			useStore.getState().setXmppStatus(true);
		}
		catchUpChatState();
		return;
	}
	if (wasPure) {
		useStore.getState().resetXmppData();
		getToken()
			.then((resp) => xmppClient.connect(resp.zmToken))
			.catch(() => useStore.getState().setChatsBeStatus(false));
	}
}
