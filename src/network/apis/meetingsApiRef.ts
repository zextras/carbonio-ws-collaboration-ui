/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IMeetingsApi } from '../../types/network/apis/IMeetingsApi';

let apiRef: IMeetingsApi | null = null;

export function setMeetingsApiRef(api: IMeetingsApi): void {
	apiRef = api;
}

export function getMeetingsApi(): IMeetingsApi {
	if (!apiRef) throw new Error('MeetingsApi not initialized');
	return apiRef;
}
