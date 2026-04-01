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
 *
 * @param serviceId - The service-id of the TURN server instance to authenticate against.
 */
export async function fetchTurnIceServers(serviceId: string): Promise<RTCIceServer[]> {
	try {
		const response = await fetch('/services/turn/credentials', {
			method: 'GET',
			credentials: 'same-origin',
			headers: {
				'service-id': serviceId
			}
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
