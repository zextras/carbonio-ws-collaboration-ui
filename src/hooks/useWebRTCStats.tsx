/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef } from 'react';

import useStore from '../store/Store';
import { NetworkQualityLevel, NetworkStats } from '../types/store/ActiveMeetingTypes';

const POLL_INTERVAL_MS = 4000;
const STATS_HISTORY_SIZE = 5;

type RawStats = { rtt?: number; fractionLost?: number };

const computeQuality = (
	rtt: number | undefined,
	fractionLost: number | undefined
): NetworkQualityLevel => {
	if (rtt === undefined && fractionLost === undefined) return NetworkQualityLevel.UNKNOWN;
	const rttMs = rtt ?? 0;
	const loss = fractionLost ?? 0;
	console.log(`Computed network quality with RTT: ${rttMs} ms, Loss: ${loss * 100}%`);
	if (rttMs < 150 && loss < 0.02) return NetworkQualityLevel.GOOD;
	if (rttMs < 300 && loss < 0.05) return NetworkQualityLevel.FAIR;
	return NetworkQualityLevel.POOR;
};

const computeAverageQuality = (history: RawStats[]): NetworkQualityLevel => {
	if (history.length === 0) return NetworkQualityLevel.UNKNOWN;
	const rtts = history.filter((s) => s.rtt !== undefined).map((s) => s.rtt as number);
	const losses = history
		.filter((s) => s.fractionLost !== undefined)
		.map((s) => s.fractionLost as number);
	const avgRtt = rtts.length > 0 ? rtts.reduce((a, b) => a + b, 0) / rtts.length : undefined;
	const avgLoss =
		losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : undefined;
	return computeQuality(avgRtt, avgLoss);
};

const useWebRTCStats = (meetingId: string): void => {
	const prevVideoBytesRef = useRef<number>(0);
	const statsHistoryRef = useRef<RawStats[]>([]);
	const prevQualityRef = useRef<NetworkQualityLevel>(NetworkQualityLevel.UNKNOWN);

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
					const rawStats: RawStats = { rtt: audioStats.rtt, fractionLost: audioStats.fractionLost };
					statsHistoryRef.current = [
						...statsHistoryRef.current.slice(-(STATS_HISTORY_SIZE - 1)),
						rawStats
					];

					const quality = computeAverageQuality(statsHistoryRef.current);
					const stats: NetworkStats = {
						quality,
						rtt: audioStats.rtt,
						fractionLost: audioStats.fractionLost,
						videoBitrateKbps: videoStats.videoBitrateKbps
					};
					setNetworkStats(stats);

					if (quality !== prevQualityRef.current) {
						prevQualityRef.current = quality;
						if (quality !== NetworkQualityLevel.UNKNOWN) {
							const { activeMeeting: currentMeeting } = useStore.getState();
							currentMeeting?.videoOutConn
								?.setOutboundQuality(quality)
								.catch((err) => console.warn('Failed to set video outbound quality', err));
							currentMeeting?.bidirectionalAudioConn
								?.setOutboundQuality(quality)
								.catch((err) => console.warn('Failed to set audio outbound quality', err));
							currentMeeting?.screenOutConn
								?.setOutboundQuality(quality)
								.catch((err) => console.warn('Failed to set screen outbound quality', err));

							if (quality === NetworkQualityLevel.POOR && currentMeeting?.videoSubscriptionsEnabled) {
								// set video subscription to false to save bandwidth
								useStore.getState().setVideoSubscriptionsEnabled(false);
								console.warn('Network quality is poor. Consider switching to audio-only mode.');
							}

							if (quality === NetworkQualityLevel.GOOD && !currentMeeting?.videoSubscriptionsEnabled) {
								// set video subscription to true to restore video
								useStore.getState().setVideoSubscriptionsEnabled(true);
								console.warn('Network quality has improved. Consider switching back to video mode.');
							}

						}
					}
				})
				.catch(() => undefined);
		}, POLL_INTERVAL_MS);

		return (): void => clearInterval(interval);
	}, [meetingId]);
};

export { computeQuality, computeAverageQuality };
export default useWebRTCStats;
