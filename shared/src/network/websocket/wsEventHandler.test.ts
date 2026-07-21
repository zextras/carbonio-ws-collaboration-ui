/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { conversationEvents, meetingEvents } from './eventHandlersUtilities.test';
import * as WsConversationEventsHandler from './wsConversationEventsHandler';
import { wsEventsHandler } from './wsEventsHandler';
import * as WsMeetingEventsHandler from './wsMeetingEventHandlers/wsMeetingEventsHandler';
import { WsEvent } from '../../types/network/websocket/wsEvents';

describe('wsEventHandler tests', () => {
	test.each(conversationEvents)('should handle %s', (event) => {
		const handler = vi.spyOn(WsConversationEventsHandler, 'wsConversationEventsHandler');
		const wsEvent = { type: event } as WsEvent;
		wsEventsHandler(wsEvent);
		expect(handler).toHaveBeenCalledWith(wsEvent);
	});

	test.each(meetingEvents)('should handle %s', (event) => {
		const handler = vi.spyOn(WsMeetingEventsHandler, 'wsMeetingEventsHandler');
		const wsEvent = { type: event } as WsEvent;
		wsEventsHandler(wsEvent);
		expect(handler).toHaveBeenCalledWith(wsEvent);
	});
});
