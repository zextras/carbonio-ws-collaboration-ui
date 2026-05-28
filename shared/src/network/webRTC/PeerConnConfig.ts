/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IPeerConnConfig } from '../../types/network/webRTC/webRTC';

export class PeerConnConfig implements IPeerConnConfig {
	static turnServers: RTCIceServer[] = [];

	defaultConfig: RTCConfiguration;

	defaultRTCIceServers: RTCIceServer[];

	additionalRTCIceServers: RTCIceServer[];

	constructor() {
		this.defaultRTCIceServers = [];
		this.additionalRTCIceServers = [];
		this.defaultConfig = {
			iceServers: this.defaultRTCIceServers,
			bundlePolicy: 'balanced'
		};
	}

	static setTurnServers(servers: RTCIceServer[]): void {
		PeerConnConfig.turnServers = servers;
	}

	addIceServer(iceServer: RTCIceServer): void {
		this.additionalRTCIceServers.push(iceServer);
	}

	getConfig(): RTCConfiguration {
		return {
			...this.defaultConfig,
			iceServers: [
				...this.defaultRTCIceServers,
				...this.additionalRTCIceServers,
				...PeerConnConfig.turnServers
			],
			iceTransportPolicy: 'all'
		};
	}
}
