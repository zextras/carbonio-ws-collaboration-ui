/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
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
			break;
		}
		default: {
			console.error(`Unhandled general event type: ${event.type}`);
		}
	}
};
