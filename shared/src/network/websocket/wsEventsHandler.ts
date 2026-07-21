/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventArea, getEventArea } from './eventHandlersUtilities';
import { wsConversationEventsHandler } from './wsConversationEventsHandler';
import { wsGeneralEventsHandler } from './wsGeneralEventsHandler';
import { wsMeetingEventsHandler } from './wsMeetingEventHandlers/wsMeetingEventsHandler';
import { WsEvent } from '../../types/network/websocket/wsEvents';
import { wsDebug } from '../../utils/debug';

export function wsEventsHandler(event: WsEvent): void {
	switch (getEventArea(event.type)) {
		case EventArea.GENERAL: {
			wsGeneralEventsHandler(event);
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
			wsDebug('Unhandled event:', event);
			break;
	}
}
