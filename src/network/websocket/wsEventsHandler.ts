/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable sonarjs/max-switch-cases */

import { EventArea, getEventArea } from './getEventArea';
import { wsConversationEventsHandler } from './wsConversationEventsHandler';
import { wsMeetingEventsHandler } from './wsMeetingEventsHandler';
import useStore from '../../store/Store';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { wsDebug } from '../../utils/debug';

export function wsEventsHandler(event: WsEvent): void {
	const state = useStore.getState();
	switch (getEventArea(event.type)) {
		case EventArea.GENERAL: {
			if (event.type === WsEventType.INITIALIZATION) {
				state.setSessionId(event.queueId);
			}
			break;
		}
		case EventArea.CONVERSATION: {
			wsConversationEventsHandler(event);
			break;
		}
		case EventArea.MEETING: {
			wsMeetingEventsHandler(event);
			break;
		}
		default:
			wsDebug('Unhandled event', event);
			break;
	}
}
