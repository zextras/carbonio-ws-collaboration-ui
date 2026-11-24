/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gte } from 'semver';

import { Version } from '../../types/store/SessionTypes';

const ICE_RESTART_MIN_API_VERSION = '1.6.6';
const SCREEN_ICE_RESTART_MIN_API_VERSION = '1.6.13';
const ICE_RESTART_FIRST_RETRY_MS = 5000;
const ICE_RESTART_MAX_RETRY_MS = 30000;
const ICE_RESTART_ANSWER_TIMEOUT_MS = 15000;

export const isIceRestartSupported = (apiVersion: Version | undefined): boolean =>
	!!apiVersion && gte(apiVersion, ICE_RESTART_MIN_API_VERSION);

export const isScreenIceRestartSupported = (apiVersion: Version | undefined): boolean =>
	!!apiVersion && gte(apiVersion, SCREEN_ICE_RESTART_MIN_API_VERSION);

const restarting = new WeakSet<RTCPeerConnection>();

export const restartIce = (peerConn: RTCPeerConnection, restart: () => Promise<unknown>): void => {
	if (restarting.has(peerConn)) return;
	restarting.add(peerConn);
	let retryDelay = ICE_RESTART_FIRST_RETRY_MS;
	const attempt = (): void => {
		if (peerConn.connectionState === 'connected' || peerConn.connectionState === 'closed') {
			restarting.delete(peerConn);
			return;
		}
		restart()
			// The answer comes back over the websocket and can be lost even when the call succeeds
			.then(() => setTimeout(attempt, ICE_RESTART_ANSWER_TIMEOUT_MS))
			.catch((reason) => {
				console.warn(`ICE restart failed, retrying in ${retryDelay} ms`, reason);
				setTimeout(attempt, retryDelay);
				retryDelay = Math.min(retryDelay * 2, ICE_RESTART_MAX_RETRY_MS);
			});
	};
	attempt();
};

// An unanswered offer keeps signaling out of 'stable' and blocks every other negotiation
const rollBackPendingOffer = async (peerConn: RTCPeerConnection): Promise<void> => {
	if (peerConn.signalingState === 'have-local-offer') {
		await peerConn.setLocalDescription({ type: 'rollback' });
	}
};

export const restartIceWithOffer = (
	peerConn: RTCPeerConnection,
	sendOffer: (sdp: string) => Promise<unknown>
): void =>
	restartIce(peerConn, async () => {
		await rollBackPendingOffer(peerConn);
		try {
			await peerConn.setLocalDescription(await peerConn.createOffer({ iceRestart: true }));
			const sdp = peerConn.localDescription?.sdp;
			if (!sdp) throw new Error('Missing ICE restart offer');
			await sendOffer(sdp);
		} catch (reason) {
			await rollBackPendingOffer(peerConn);
			throw reason;
		}
	});
