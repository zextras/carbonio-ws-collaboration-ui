/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RequestType } from '../../types/network/apis/IBaseAPI';
import { fetchAPI } from '../../utils/FetchUtils';

export type PresenceTimeoutResponse = {
	timeoutSeconds: number;
};

export type PresenceStatusResponse = {
	userId: string;
	online: boolean;
	lastActivityAt?: string;
};

class PresenceApi {
	private static instance: PresenceApi;
	private timeoutSeconds: number | null = null;
	private pollingInterval: ReturnType<typeof setInterval> | null = null;

	public static getInstance(): PresenceApi {
		if (!PresenceApi.instance) {
			PresenceApi.instance = new PresenceApi();
		}
		return PresenceApi.instance;
	}

	/**
	 * Gets the presence timeout value from the backend.
	 * This should be called once at page load.
	 */
	public async getTimeout(): Promise<number> {
		if (this.timeoutSeconds !== null) {
			return this.timeoutSeconds;
		}
		const response: PresenceTimeoutResponse = await fetchAPI('presence/timeout', RequestType.GET);
		this.timeoutSeconds = response.timeoutSeconds;
		return this.timeoutSeconds;
	}

	/**
	 * Updates the current user's presence to ONLINE.
	 * This should be called every (timeout - 5) seconds.
	 */
	public async updatePresence(): Promise<PresenceStatusResponse> {
		return fetchAPI('presence', RequestType.PUT);
	}

	/**
	 * Starts the presence polling.
	 * Calls PUT /presence every (timeout - 5) seconds.
	 */
	public async startPolling(): Promise<void> {
		// Stop any existing polling
		this.stopPolling();

		// Get timeout from backend
		const timeout = await this.getTimeout();
		const pollInterval = (timeout - 5) * 1000; // Convert to milliseconds

		// Make initial presence update
		await this.updatePresence();

		// Start polling
		this.pollingInterval = setInterval(async () => {
			try {
				await this.updatePresence();
			} catch (error) {
				console.error('[PresenceApi] Error updating presence:', error);
			}
		}, pollInterval);

		console.log(
			`[PresenceApi] Started presence polling every ${timeout - 5} seconds (timeout: ${timeout}s)`
		);
	}

	/**
	 * Stops the presence polling.
	 */
	public stopPolling(): void {
		if (this.pollingInterval !== null) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
			console.log('[PresenceApi] Stopped presence polling');
		}
	}
}

export default PresenceApi.getInstance();
