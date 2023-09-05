/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PeerConnConfig } from './PeerConnConfig';
import { IVideoInConnection } from '../../types/network/webRTC/webRTC';

export default class VideoInConnection implements IVideoInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	constructor(meetingId: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.meetingId = meetingId;
	}

	/**
	 * close all tracks and peerConnection
	 */
	closePeerConnection: () => void = () => {
		this.peerConn.close?.();
	};
}
