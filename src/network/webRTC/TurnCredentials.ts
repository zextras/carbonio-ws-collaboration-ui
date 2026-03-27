/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

interface TurnCredentialsResponse {
	username: string;
	credential: string;
	ttl: number;
}

/**
 * Fetches ephemeral TURN credentials from the auth service.
 * Returns an RTCIceServer array for use in PeerConnConfig.
 * Returns empty array if TURN is not configured (204) or on error.
 *
 * The TURN URL is computed from the current proxy hostname — the backend
 * no longer returns it because it is always `turns:<proxy>:443?transport=tcp`.
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
		const turnUrl = `turns:${window.location.hostname}:443?transport=tcp`;
		return [
			{
				urls: turnUrl,
				username: data.username,
				credential: data.credential
			}
		];
	} catch {
		return [];
	}
}
