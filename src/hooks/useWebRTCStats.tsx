/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef } from 'react';

import useStore from '../store/Store';
import { NetworkQualityLevel, NetworkStats } from '../types/store/ActiveMeetingTypes';

const POLL_INTERVAL_MS = 4000;

const computeQuality = (
	rtt: number | undefined,
	fractionLost: number | undefined
): NetworkQualityLevel => {
	if (rtt === undefined && fractionLost === undefined) return NetworkQualityLevel.UNKNOWN;
	const rttMs = rtt ?? 0;
	const loss = fractionLost ?? 0;
	if (rttMs < 150 && loss < 0.02) return NetworkQualityLevel.GOOD;
	if (rttMs < 300 && loss < 0.05) return NetworkQualityLevel.FAIR;
	return NetworkQualityLevel.POOR;
};

const useWebRTCStats = (meetingId: string): void => {
	const prevVideoBytesRef = useRef<number>(0);

	useEffect(() => {
		const interval = setInterval(() => {
			const { activeMeeting, setNetworkStats } = useStore.getState();
			if (activeMeeting?.meetingId !== meetingId) return;

			const audioConn = activeMeeting.bidirectionalAudioConn?.peerConn;
			const videoConn = activeMeeting.videoOutConn?.peerConn;

			const audioStatsPromise: Promise<{ rtt?: number; fractionLost?: number }> = audioConn
				? audioConn.getStats().then((statsReport) => {
						let rtt: number | undefined;
						let fractionLost: number | undefined;
						statsReport.forEach((report) => {
							if (report.type === 'remote-inbound-rtp' && report.kind === 'audio') {
								if (typeof report.roundTripTime === 'number') {
									rtt = report.roundTripTime * 1000;
								}
								if (typeof report.fractionLost === 'number') {
									fractionLost = report.fractionLost;
								}
							}
						});
						return { rtt, fractionLost };
					})
				: Promise.resolve({});

			const prevBytes = prevVideoBytesRef.current;
			const videoStatsPromise: Promise<{ videoBitrateKbps?: number }> = videoConn
				? videoConn.getStats().then((statsReport) => {
						let videoBitrateKbps: number | undefined;
						statsReport.forEach((report) => {
							if (report.type === 'outbound-rtp' && report.kind === 'video') {
								const bytesSent: number = (report as RTCOutboundRtpStreamStats).bytesSent ?? 0;
								if (prevBytes > 0 && bytesSent >= prevBytes) {
									videoBitrateKbps = Math.round(
										((bytesSent - prevBytes) * 8) / (POLL_INTERVAL_MS / 1000) / 1000
									);
								}
								prevVideoBytesRef.current = bytesSent;
							}
						});
						return { videoBitrateKbps };
					})
				: Promise.resolve({});

			Promise.all([audioStatsPromise, videoStatsPromise])
				.then(([audioStats, videoStats]) => {
					const stats: NetworkStats = {
						quality: computeQuality(audioStats.rtt, audioStats.fractionLost),
						rtt: audioStats.rtt,
						fractionLost: audioStats.fractionLost,
						videoBitrateKbps: videoStats.videoBitrateKbps
					};
					setNetworkStats(stats);
				})
				.catch(() => undefined);
		}, POLL_INTERVAL_MS);

		return (): void => clearInterval(interval);
	}, [meetingId]);
};

export { computeQuality };
export default useWebRTCStats;
