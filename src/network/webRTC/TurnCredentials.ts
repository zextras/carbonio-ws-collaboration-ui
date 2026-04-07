/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
export async function fetchTurnIceServers(meetingId: string): Promise<RTCIceServer[]> {
	try {
		const response = await fetch(`/services/chats/meetings/${meetingId}/turnCredentials`, {
			method: 'GET',
			credentials: 'same-origin'
		});

		if (response.status === 204 || !response.ok) {
			return [];
		}

		const data: TurnCredentialsResponse = await response.json();
		return [
			{
				urls: data.url,
				username: data.username,
				credential: data.credential
			}
		];
	} catch {
		return [];
	}
}
