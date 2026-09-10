/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, keyBy } from 'lodash';
import { gte } from 'semver';

import { DownlinkSmState, initialDownlinkSmState, tickDownlinkSm } from './downlinkStateMachine';
import {
	CentralDownlinkState,
	decideDownlink,
	DownlinkChange,
	initialCentralState,
	initialFeedState,
	layersOf,
	TOP_RUNG
} from './inboundQualityController';
import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import { QualitySignals } from './voteWindow';
import { getUserName } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { StreamInfo, StreamMap } from '../../types/network/models/meetingBeTypes';
import { IVideoScreenInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { rtcDebug } from '../../utils/debug';
import { DownloadCap, getDownloadCap } from '../../utils/debugStreamCaps';
import { createMediaAnswer, requestVideoQuality, videoIceRestart } from '../apis/MeetingsApi';

// Why a downlink resolution/framerate change happened: OUR controller shedding quality under our own
// downlink congestion, or the SENDER changing what they publish (their network).
export type DownlinkChangeReason = 'OUR_NETWORK' | 'THEIR_NETWORK';

// height label per substream index (resolution-before-framerate ladder).
const heightName = (substream: number): string => ['144', '360', '720'][substream] ?? '?';

// Rough framerate a temporal target implies relative to the currently received fps (temporal 2 = full,
// temporal 1 ≈ half) — for the debug descriptor only.
const framerateOf = (fps: number, temporal: 1 | 2 | undefined): number =>
	Math.round(temporal === 2 ? fps * 2 : fps / 2);

// The received fps of a feed's inbound video — the ONLY per-feed stat the vote-driven controller needs
// (for the FPS_FLOOR resolution-vs-framerate choice on a down-step).
const readInboundFps = (report: RTCStatsReport): number => {
	let fps = 0;
	report.forEach((r: RTCStats & { framesPerSecond?: number; kind?: string }) => {
		if (r.type === 'inbound-rtp' && r.kind === 'video' && r.framesPerSecond != null) {
			fps = r.framesPerSecond;
		}
	});
	return fps;
};

// Per-feed handle collected before the centralized decision is run.
type FeedTick = { key: string; userId: string; mid: string; fps: number };

export default class VideoScreenInConnection implements IVideoScreenInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager?: SubscriptionsManager;

	streamsMap: StreamMap;

	private videoReceivers = new Map<string, { receiver: RTCRtpReceiver; userId: string }>();

	private centralState: CentralDownlinkState = initialCentralState();

	private suppressedVideo = new Map<string, { userId: string; offAtTick: number }>();

	// last EFFECTIVE received substream per feed = min(what WE request, what the SENDER publishes as
	// maxTier), plus the two inputs, so a change can be attributed to our controller vs the sender.
	private lastEffTier = new Map<string, { eff: number; req: number; pub: number }>();

	private evalTick = 0;

	private downlinkSmState: DownlinkSmState = initialDownlinkSmState();

	// DEBUG-ONLY manual download cap overlay. Inert (and the whole overlay path is skipped) unless the
	// console hook sets a cap. `debugDownlinkActive` latches so the untouched default path is used
	// byte-for-byte whenever the cap has never been touched; `lastAppliedRung` de-dupes reconcile
	// requests; `debugOffFeeds` remembers feeds a debug OFF suppressed so a later tier can re-subscribe them.
	private debugDownlinkActive = false;

	private lastAppliedRung = new Map<string, number>();

	private debugOffFeeds = new Map<string, string>();

	constructor(meetingId: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.peerConn.onconnectionstatechange = this.onConnectionStateChange;
		this.meetingId = meetingId;
		this.subscriptionManager = new SubscriptionsManager(meetingId);
		this.streamsMap = {};
	}

	private readonly onConnectionStateChange = (): void => {
		const state = this.peerConn?.connectionState;
		const version = useStore.getState().session.apiVersion;
		if (state === 'failed' && version && gte(version, '1.6.6')) {
			videoIceRestart(this.meetingId);
		}
	};

	// Handle remote offer creating an answer and sending it to the remote peer
	public handleRemoteOffer(sdp: string): void {
		const offer = new RTCSessionDescription({ sdp, type: 'offer' });
		this.peerConn
			.setRemoteDescription(offer)
			.then(() => {
				this.peerConn
					.createAnswer()
					.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
						this.peerConn
							.setLocalDescription(rtcSessionDesc)
							.then(() => {
								if (rtcSessionDesc.sdp) {
									createMediaAnswer(this.meetingId, rtcSessionDesc.sdp);
								}
							})
							.catch((reason) => console.warn('setLocalDescription failed', reason));
					})
					.catch((reason) => console.warn('createAnswer failed', reason));
			})
			.catch((reason) => console.warn('setRemoteDescription failed', reason));
	}

	public handleParticipantsSubscribed(streamsMap: StreamInfo[]): void {
		const temporaryStreams: StreamMap = {};
		forEach(streamsMap, (stream) => {
			const streamsKey = `${stream.userId}-${stream.type.toLowerCase()}`;
			temporaryStreams[streamsKey] = {
				...this.streamsMap[streamsKey],
				userId: stream.userId,
				type: stream.type.toLowerCase() as STREAM_TYPE,
				mid: stream.mid
			};
		});

		this.streamsMap = temporaryStreams;
		this.updateStreams();
	}

	public removeStream = (streamKey: string, streamType: STREAM_TYPE[]): void => {
		forEach(streamType, (type) => {
			const key = `${streamKey}-${type}`;
			delete this.streamsMap[key];
			if (type === STREAM_TYPE.VIDEO) {
				this.videoReceivers.delete(key);
				this.centralState.feeds.delete(key);
				this.suppressedVideo.delete(key);
				this.lastAppliedRung.delete(key);
				this.debugOffFeeds.delete(key);
			}
		});
	};

	private onTrack = (ev: RTCTrackEvent): void => {
		forEach(ev.streams, (stream) => {
			const userId = stream.id.split('/')[0];
			const type = stream.id.split('/')[1].toLowerCase() as STREAM_TYPE;
			if (userId && type) {
				const streamsKey = `${userId}-${type}`;
				this.streamsMap[streamsKey] = {
					...this.streamsMap[streamsKey],
					stream
				};
				if (type === STREAM_TYPE.VIDEO) {
					this.videoReceivers.set(streamsKey, { receiver: ev.receiver, userId });
					if (this.suppressedVideo.has(streamsKey)) {
						// Re-enabling an auto-off feed: keep the current rung set by the UP ticks
						// (the feed is climbing back gradually — do NOT reset to TOP_RUNG).
						this.suppressedVideo.delete(streamsKey);
					} else {
						// Fresh subscribe: enter at the top rung.
						this.centralState.feeds.set(streamsKey, initialFeedState(TOP_RUNG));
					}
				}
			}
		});
		this.updateStreams();
	};

	// Driven by the connection monitor's single 2 s loop. Receives displayBars + snackbar signals from
	// the vote buffer; passes displayBars to the centralized global-rung decider; applies ALL rung changes
	// at once (one per feed whose effective rung moved); updates the snackbar. Down/up decisions are now
	// computed inside decideDownlink from the resettable evidence buffer.
	public evaluateQualityTick = (signals: QualitySignals): Promise<void> => {
		this.evalTick += 1;

		const activeFeedEntries = Array.from(this.videoReceivers.entries()).filter(
			([key]) => !!this.streamsMap[key]?.mid && !this.suppressedVideo.has(key)
		);

		// The only per-feed read we still need is the received fps (for the FPS_FLOOR step choice).
		const feedStats = Promise.all(
			activeFeedEntries.map(([key, { receiver, userId }]) => {
				const mid = this.streamsMap[key]?.mid;
				if (mid == null) return null;
				return receiver
					.getStats()
					.then((report): FeedTick => ({ key, userId, mid, fps: readInboundFps(report) }))
					.catch((): FeedTick | null => null);
			})
		);

		return feedStats.then((rawResults) => {
			const feeds = rawResults.filter((r): r is FeedTick => r !== null);
			const fpsByFeed = new Map(feeds.map((r) => [r.key, r.fps]));

			// Build the senderMax map from the store: effectiveRung = min(targetRung, senderMax).
			// WHY: the subscriber's global targetRung is capped per feed by what the sender publishes.
			const store = useStore.getState();
			const am = store.activeMeeting;
			const senderMaxByFeed = new Map<string, number>();
			if (am && am.meetingId === this.meetingId) {
				this.centralState.feeds.forEach((_, key) => {
					const { userId } = this.videoReceivers.get(key) ??
						this.suppressedVideo.get(key) ?? { userId: undefined };
					if (userId != null) {
						const maxTier = am.connectionQuality[userId]?.maxTier;
						if (maxTier != null) senderMaxByFeed.set(key, maxTier);
					}
				});
			}

			// Run the centralized global-rung decider — may return changes for ALL feeds at once.
			const { state: nextState, changes } = decideDownlink(
				this.centralState,
				fpsByFeed,
				signals.displayBars,
				senderMaxByFeed
			);
			this.centralState = nextState;

			// DEBUG download cap: when a manual cap is (or was just) active the overlay clamps every
			// request; otherwise the default per-change sweep runs, byte-for-byte unchanged.
			const downloadCap = getDownloadCap();
			const capActive = downloadCap !== null;
			if (!capActive && !this.debugDownlinkActive) {
				changes.forEach((change) => this.applyDownlinkChangeDefault(change, feeds));
			} else {
				this.applyDownlinkChangesWithCap(changes, feeds, downloadCap);
			}
			this.debugDownlinkActive = capActive;

			this.logDownlinkTierChanges();
			this.evaluateDownlinkSnackbar(signals);
		});
	};

	// The DEFAULT (uncapped) per-change apply — extracted verbatim from the original inline sweep so the
	// hot path stays flat. Suppress on auto-off; re-subscribe an auto-off feed the UP selected; otherwise
	// request the new quality and log a temporal-only step.
	private applyDownlinkChangeDefault(change: DownlinkChange, feeds: FeedTick[]): void {
		if (change.off) {
			const r = feeds.find((fr) => fr.key === change.key);
			if (r) this.suppressFeed(change.key, r.userId);
			return;
		}
		if (change.changeSubstream === undefined) return;
		const { changeSubstream } = change;
		if (this.suppressedVideo.has(change.key)) {
			// The UP selected an auto-off feed: re-subscribe it instead of requesting a quality change
			// (there is no active track yet). The 'suppressed' flag is cleared only in onTrack when the real
			// track arrives — so a failed re-subscription is automatically retried on the next UP tick.
			const { userId } = this.suppressedVideo.get(change.key)!;
			this.resubscribeFeed(change.key, userId);
			this.logDownlinkChange('off', heightName(layersOf(change.rung).substream), 'OUR_NETWORK');
			return;
		}
		const r = feeds.find((fr) => fr.key === change.key);
		if (!r) return;
		requestVideoQuality(
			this.meetingId,
			r.userId,
			r.mid,
			changeSubstream,
			change.changeTemporal
		).catch(() => {});
		// Temporal-only (framerate) steps never move the effective substream, so log them here;
		// RESOLUTION changes (ours OR the sender's) are logged by logDownlinkTierChanges.
		if (!change.substreamChanged) {
			const height = heightName(changeSubstream);
			this.logDownlinkChange(
				`${height}@${Math.round(r.fps)}fps`,
				`${height}@${framerateOf(r.fps, change.changeTemporal)}fps`,
				'OUR_NETWORK'
			);
		}
	}

	// DEBUG overlay apply. The controller (decideDownlink) has already run and evolved centralState on the
	// real signals; here we only clamp what we REQUEST from Janus. The controller's lifecycle transitions
	// (auto-off, auto-off -> re-subscribe) are honored; every active feed is reconciled to min(rung, cap).
	private applyDownlinkChangesWithCap(
		changes: DownlinkChange[],
		feeds: FeedTick[],
		cap: DownloadCap
	): void {
		changes.forEach((change) => this.applyCapLifecycle(change, feeds));

		if (cap === 'OFF') {
			this.debugForceAllOff(feeds);
			return;
		}
		this.restoreDebugOffFeeds();
		// Fresh activation after being uncapped: drop stale last-applied so the reconcile applies cleanly.
		if (!this.debugDownlinkActive) this.lastAppliedRung.clear();
		const capRung = typeof cap === 'number' ? cap : undefined; // null (cleared) -> no clamp
		feeds.forEach((r) => this.reconcileFeedToCap(r, capRung));
	}

	// Under a cap, honor only the controller's lifecycle transitions; quality-only changes are owned by
	// the reconcile so they can be clamped.
	private applyCapLifecycle(change: DownlinkChange, feeds: FeedTick[]): void {
		if (change.off) {
			const r = feeds.find((fr) => fr.key === change.key);
			if (r) this.suppressFeed(change.key, r.userId);
		} else if (this.suppressedVideo.has(change.key)) {
			const entry = this.suppressedVideo.get(change.key);
			if (entry) this.resubscribeFeed(change.key, entry.userId);
		}
	}

	// Debug OFF: force every still-active feed off, remembering it so a later tier can restore it.
	private debugForceAllOff(feeds: FeedTick[]): void {
		feeds.forEach((r) => {
			if (this.suppressedVideo.has(r.key)) return;
			this.debugOffFeeds.set(r.key, r.userId);
			this.suppressFeed(r.key, r.userId);
		});
	}

	// Re-subscribe every feed a previous debug OFF suppressed (called when the cap leaves OFF).
	private restoreDebugOffFeeds(): void {
		if (this.debugOffFeeds.size === 0) return;
		this.debugOffFeeds.forEach((userId, key) => this.resubscribeFeed(key, userId));
		this.debugOffFeeds.clear();
	}

	// Request min(controller rung, cap) for one feed, de-duped against the last value we applied.
	private reconcileFeedToCap(r: FeedTick, capRung: number | undefined): void {
		const fs = this.centralState.feeds.get(r.key);
		if (fs === undefined) return;
		const desiredRung = capRung !== undefined ? Math.min(fs.rung, capRung) : fs.rung;
		if (this.lastAppliedRung.get(r.key) === desiredRung) return;
		this.lastAppliedRung.set(r.key, desiredRung);
		const { substream, temporal } = layersOf(desiredRung);
		requestVideoQuality(this.meetingId, r.userId, r.mid, substream, temporal).catch(() => {});
	}

	private resubscribeFeed(key: string, userId: string): void {
		useStore.getState().setAddSubscription(this.meetingId, { userId, type: STREAM_TYPE.VIDEO });
		useStore.getState().setLocalVideoSuppressed(this.meetingId, userId, false);
	}

	// Debug logs identify the feed by display name / email, not the raw user id.
	private who(userId: string): string {
		return getUserName(useStore.getState(), userId) || userId;
	}

	// Single downlink-quality-change log. OUR_NETWORK = our controller's own decision (no participant
	// name); THEIR_NETWORK = the sender changed what they publish (named). 'off' is a first-class value.
	private logDownlinkChange(
		from: string,
		to: string,
		reason: DownlinkChangeReason,
		name?: string
	): void {
		if (reason === 'THEIR_NETWORK') {
			rtcDebug(`[DOWNLINK QUALITY CHANGE] ${name}: ${from} -> ${to} (reason: THEIR_NETWORK)`);
		} else {
			rtcDebug(`[DOWNLINK QUALITY CHANGE] ${from} -> ${to} (reason: OUR_NETWORK)`);
		}
	}

	private suppressFeed(key: string, userId: string): void {
		useStore.getState().setRemoveSubscription(this.meetingId, { userId, type: STREAM_TYPE.VIDEO });
		useStore.getState().setLocalVideoSuppressed(this.meetingId, userId, true);
		this.suppressedVideo.set(key, { userId, offAtTick: this.evalTick });
		this.videoReceivers.delete(key);
		// Keep the feed in centralState.feeds at rung 0 so the UP vote path can select it to climb.
		// (decideDownlink already left it there at rung 0 when it emitted change.off = true.)
		const prev = this.lastEffTier.get(key);
		this.lastEffTier.delete(key);
		this.logDownlinkChange(heightName(prev?.eff ?? 0), 'off', 'OUR_NETWORK');
	}

	// EFFECT-BASED downlink tier log: the resolution we actually receive of a feed is
	// min(what our controller requests, what the sender publishes as maxTier). Log every change of that
	// effective substream with its CAUSE — our own controller (downlink congestion) or the SENDER
	// raising/lowering their upload — in both directions. Temporal/framerate steps are logged at the
	// controller (always ours; they never move the substream).
	private logDownlinkTierChanges(): void {
		const store = useStore.getState();
		const am = store.activeMeeting;
		if (!am || am.meetingId !== this.meetingId) return;
		const present = new Set<string>();
		Array.from(this.videoReceivers.entries())
			.filter(([key]) => !!this.streamsMap[key]?.mid)
			.forEach(([key, { userId }]) => {
				const feedState = this.centralState.feeds.get(key);
				const pub = am.connectionQuality[userId]?.maxTier;
				if (feedState === undefined || pub === undefined) {
					this.lastEffTier.delete(key); // no rung yet, or sender publishes no webcam tier
					return;
				}
				present.add(key);
				const req = layersOf(feedState.rung).substream;
				const eff = Math.min(req, pub);
				const prev = this.lastEffTier.get(key);
				this.lastEffTier.set(key, { eff, req, pub });
				if (prev === undefined || eff === prev.eff) return; // baseline / no effective change
				const senderBound = pub !== prev.pub && pub <= req;
				const reason: DownlinkChangeReason = senderBound ? 'THEIR_NETWORK' : 'OUR_NETWORK';
				this.logDownlinkChange(
					heightName(prev.eff),
					heightName(eff),
					reason,
					senderBound ? this.who(userId) : undefined
				);
			});
		Array.from(this.lastEffTier.keys()).forEach((k) => {
			if (!present.has(k)) this.lastEffTier.delete(k);
		});
	}

	private evaluateDownlinkSnackbar(signals: QualitySignals): void {
		const store = useStore.getState();
		if (!store.activeMeeting || store.activeMeeting.meetingId !== this.meetingId) return;

		// FLOORED: quality has been driven to the minimum possible. With a global targetRung, "floored"
		// means targetRung === 0 (every feed is at or below the lowest rung) or all feeds are auto-off.
		// A feed capped by a low senderMax is already at its floor independently of our targetRung.
		const activeKeys = Array.from(this.videoReceivers.keys()).filter(
			(key) => !!this.streamsMap[key]?.mid
		);
		const allFeedsAtFloor =
			this.centralState.allAutoOff ||
			activeKeys.length === 0 ||
			activeKeys.every((key) => (this.centralState.feeds.get(key)?.rung ?? 0) === 0);
		const myUserId = store.session?.id;
		const myQuality =
			myUserId != null ? store.activeMeeting.connectionQuality[myUserId] : undefined;
		const uplinkAtMin = myQuality?.maxTier == null || myQuality.maxTier === 0;
		const floored = allFeedsAtFloor && uplinkAtMin;

		// WARN = the N-of-M official-vote signal has been predominantly poor AND quality is fully floored
		// (so we only warn when the network has confirmed poor for >=8/10 ticks AND quality hit the floor).
		// RESTORE = vote-based; NOT gated on floored — network can be good at low quality.
		const degraded = signals.warnVote && floored;
		const recovered = signals.restoreVote;

		const { state: nextState, flippedTo } = tickDownlinkSm(this.downlinkSmState, {
			degraded,
			recovered
		});
		this.downlinkSmState = nextState;

		if (flippedTo !== undefined) {
			store.setDownlinkCompromised(this.meetingId, flippedTo === 'compromised');
		}
	}

	private updateStreams(): void {
		const completeStreams = filter(this.streamsMap, (stream) => !!stream.stream && !!stream.userId);
		const newStreams = keyBy(
			completeStreams,
			(stream) => `${stream.userId}-${stream.type}`
		) as StreamsSubscriptionMap;
		useStore.getState().setSubscribedTracks(this.meetingId, newStreams);
	}

	public closePeerConnection(): void {
		this.videoReceivers.clear();
		this.centralState = initialCentralState();
		this.suppressedVideo.clear();
		this.downlinkSmState = initialDownlinkSmState();
		this.lastAppliedRung.clear();
		this.debugOffFeeds.clear();
		this.debugDownlinkActive = false;
		delete this.subscriptionManager;
		this.peerConn?.close?.();
	}
}
