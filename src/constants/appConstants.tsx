/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Version } from '../types/store/SessionTypes';

// Carbonio constants
export const CARBONIO_PATH = '/carbonio/';

// Chats zapp constants
export const PRODUCT_NAME = 'Chats';
export const CHATS_APP_ID = 'carbonio-ws-collaboration-ui';
export const CHATS_ROUTE = 'chats';

// Meetings zapp constants
export const MEETINGS_NAME = 'Meetings';
export const MEETINGS_ROUTE = 'meetings';
export const MEETINGS_PATH = `focus-mode/${MEETINGS_ROUTE}/`;

export const SOUND_NOTIFICATION_PARTICIPANT_THRESHOLD = 3;
export const LARGE_MEETING_THRESHOLD = 15;

export const QUOTA_CHANGED_EVENT = 'carbonio-ws-collaboration-ui:quota-changed';

/**
 * Chats API versions this client can speak, newest first. Seeding them in the
 * store arms the version negotiation everywhere a session boots: REST calls
 * send the newest as X-WSC-API-VERSION and renegotiate on 422, the events
 * WebSocket offers them as sub-protocols. Both the main boot (MainApp) and the
 * guest flow (useExternalAccess) must seed them before their first REST call.
 */
export const SUPPORTED_API_VERSIONS: Array<Version> = [
	'2.0.0',
	'1.6.14',
	'1.6.13',
	'1.6.12',
	'1.6.11',
	'1.6.10',
	'1.6.9',
	'1.6.8',
	'1.6.7',
	'1.6.6',
	'1.6.5',
	'1.6.4',
	'1.6.3',
	'1.6.2',
	'1.6.1',
	'1.6.0'
];

export const TRACKER_EVENT = {
	meetingEvaluation: 'Meeting evaluation',
	conversationSearch: 'Conversation search performed',
	conversationSearchError: 'Conversation search error'
};
