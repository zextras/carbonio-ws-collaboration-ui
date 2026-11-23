/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const ICE_RESTART_RETRY_MS = 5000;

const restarting = new WeakSet<RTCPeerConnection>();

const hasSettled = (peerConn: RTCPeerConnection): boolean =>
	peerConn.connectionState === 'connected' || peerConn.connectionState === 'closed';

export const restartIce = (peerConn: RTCPeerConnection, restart: () => Promise<unknown>): void => {
	if (restarting.has(peerConn)) return;
	restarting.add(peerConn);
	const attempt = (): void => {
		if (hasSettled(peerConn)) {
			restarting.delete(peerConn);
			return;
		}
		restart()
			.then(() => restarting.delete(peerConn))
			.catch((reason) => {
				console.warn('ICE restart failed, retrying', reason);
				setTimeout(attempt, ICE_RESTART_RETRY_MS);
			});
	};
	attempt();
};

export const restartIceWithOffer = (
	peerConn: RTCPeerConnection,
	sendOffer: (sdp: string) => Promise<unknown>
): void =>
	restartIce(peerConn, async () => {
		try {
			await peerConn.setLocalDescription(await peerConn.createOffer({ iceRestart: true }));
			const sdp = peerConn.localDescription?.sdp;
			if (!sdp) throw new Error('Missing ICE restart offer');
			await sendOffer(sdp);
		} catch (reason) {
			// An unanswered offer keeps signaling out of 'stable' and blocks every other negotiation
			if (peerConn.signalingState === 'have-local-offer') {
				await peerConn.setLocalDescription({ type: 'rollback' });
			}
			throw reason;
		}
	});
