/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { catchUpChatState } from './wsReconnectionHandler';
import useStore from '../../store/Store';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';

export const wsGeneralEventsHandler = (event: WsEvent): void => {
	const state = useStore.getState();

	switch (event.type) {
		case WsEventType.INITIALIZATION: {
			state.setQueueId(event.queueId);
			break;
		}
		case WsEventType.MESSAGE_BROKER_DISCONNECTED: {
			state.setMessageBrokerStatus(false);
			break;
		}
		case WsEventType.MESSAGE_BROKER_RESTORED: {
			state.setMessageBrokerStatus(true);
			// Chat events published while the broker was down are gone even though
			// the socket stayed up: same refresh as a socket reconnection
			// (WSC-pure only — on 1.6.x the chat data rode MongooseIM, v1 parity)
			catchUpChatState();
			break;
		}
		default: {
			console.error(`Unhandled general event type: ${event.type}`);
		}
	}
};
