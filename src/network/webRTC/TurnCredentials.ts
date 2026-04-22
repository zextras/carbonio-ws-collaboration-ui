/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fetchAPI, RequestType } from '../../utils/FetchUtils';

interface TurnCredentialsResponse {
	url: string;
	username: string;
	credential: string;
	ttl: number;
}

/**
 * Fetches ephemeral TURN credentials from the meetings service.
 * Returns an RTCIceServer array for use in PeerConnConfig.
 * Returns empty array if TURN is not configured (204) or on error.
 *
 * @param meetingId - The meeting ID to fetch TURN credentials for.
 */
export function fetchTurnIceServers(meetingId: string): Promise<RTCIceServer[]> {
	return fetchAPI<TurnCredentialsResponse>(`meetings/${meetingId}/turnCredentials`, RequestType.GET)
		.then((data) => {
			// fetchAPI resolves with parsed JSON when Content-Type is application/json.
			// If TURN is not configured the server returns 204 (no body, no JSON content-type),
			// in which case handleResponse returns the raw Response object — treat that as no TURN.
			if (!data || data instanceof Response) {
				return [];
			}
			return [
				{
					urls: data.url,
					username: data.username,
					credential: data.credential
				}
			];
		})
		.catch(() => []);
}
