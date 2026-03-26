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
 * Fetches ephemeral TURN credentials from the auth service.
 * Returns an RTCIceServer array for use in PeerConnConfig.
 * Returns empty array if TURN is not configured (204) or on error.
 */
export async function fetchTurnIceServers(): Promise<RTCIceServer[]> {
	try {
		const response = await fetch('/services/turn/credentials', {
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
		console.warn('Failed to fetch TURN credentials, proceeding without TURN');
		return [];
	}
}
