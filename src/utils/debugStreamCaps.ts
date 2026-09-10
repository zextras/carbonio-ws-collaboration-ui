/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Manual DEBUG hard-caps for meeting webcam stream quality, driven from the browser JS console.
 *
 *   wscStreamDebug.setUploadCap('LOW'|'MEDIUM'|'HIGH')          // cap my outbound webcam
 *   wscStreamDebug.setDownloadCap('LOW'|'MEDIUM'|'HIGH'|'OFF')  // cap all inbound webcam feeds
 *   wscStreamDebug.clear()                                      // remove both caps -> fully automatic
 *   wscStreamDebug.status()                                     // log current caps
 *
 * These are CEILINGS only, used to SIMULATE quality changes. The real adaptive logic keeps running
 * underneath and may sit below the cap (real congestion) or, when the cap is raised, climb back toward
 * it following the normal rules. When no cap is set (the default), nothing here has any effect.
 *
 * Units differ per consumer:
 *  - upload cap = rid-index ceiling 0/1/2 (l/m/h) applied via RTCRtpSender.setParameters (GCC exception:
 *    the app must actively tell the sender its max; pushed immediately on set).
 *  - download cap = rung ceiling 1/3/5 (full-fps top of substream 0/1/2) or 'OFF', pulled by
 *    VideoScreenInConnection on its 2 s tick and clamped onto the requested rung.
 */

import { rtcDebug } from './debug';
import useStore from '../store/Store';

export type UploadCapSubstream = 0 | 1 | 2 | null;
export type DownloadCap = 1 | 3 | 5 | 'OFF' | null;

const UPLOAD_TIERS: Record<string, 0 | 1 | 2> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const DOWNLOAD_TIERS: Record<string, 1 | 3 | 5> = { LOW: 1, MEDIUM: 3, HIGH: 5 };

let uploadCap: UploadCapSubstream = null;
let downloadCap: DownloadCap = null;

export const getUploadCapSubstream = (): UploadCapSubstream => uploadCap;
export const getDownloadCap = (): DownloadCap => downloadCap;

const normalize = (tier: string | null | undefined): string =>
	String(tier ?? '')
		.trim()
		.toUpperCase();

const isClear = (key: string): boolean => key === '' || key === 'AUTO' || key === 'NULL';

const applyUploadCapToLiveConnection = (): void => {
	useStore.getState().activeMeeting?.videoOutConn?.applyDebugUploadCap(uploadCap);
};

export const setUploadCap = (tier: string | null): void => {
	const key = normalize(tier);
	if (isClear(key)) {
		uploadCap = null;
	} else if (key in UPLOAD_TIERS) {
		uploadCap = UPLOAD_TIERS[key];
	} else {
		// eslint-disable-next-line no-console
		console.warn(`[wscStreamDebug] invalid upload tier "${tier}". Use LOW | MEDIUM | HIGH | AUTO.`);
		return;
	}
	rtcDebug(`[STREAM DEBUG] upload cap -> ${uploadCap === null ? 'AUTO' : key}`);
	applyUploadCapToLiveConnection();
};

export const setDownloadCap = (tier: string | null): void => {
	const key = normalize(tier);
	if (isClear(key)) {
		downloadCap = null;
	} else if (key === 'OFF') {
		downloadCap = 'OFF';
	} else if (key in DOWNLOAD_TIERS) {
		downloadCap = DOWNLOAD_TIERS[key];
	} else {
		// eslint-disable-next-line no-console
		console.warn(
			`[wscStreamDebug] invalid download tier "${tier}". Use LOW | MEDIUM | HIGH | OFF | AUTO.`
		);
		return;
	}
	rtcDebug(`[STREAM DEBUG] download cap -> ${downloadCap === null ? 'AUTO' : key}`);
	// Pulled by VideoScreenInConnection on its next tick — no push here.
};

export const clearStreamCaps = (): void => {
	setUploadCap(null);
	setDownloadCap(null);
};

const nameOf = (value: number | 'OFF' | null, tiers: Record<string, number>): string => {
	if (value === null) return 'AUTO';
	if (value === 'OFF') return 'OFF';
	const entry = Object.entries(tiers).find(([, v]) => v === value);
	return entry ? entry[0] : String(value);
};

export const streamCapsStatus = (): void => {
	const status = {
		uploadCap: nameOf(uploadCap, UPLOAD_TIERS),
		downloadCap: nameOf(downloadCap, DOWNLOAD_TIERS),
		inMeeting: !!useStore.getState().activeMeeting
	};
	// eslint-disable-next-line no-console
	(console.table ?? console.log)(status);
};

export const installStreamDebugHook = (): void => {
	if (typeof window === 'undefined') return;
	const w = window as unknown as { wscStreamDebug?: unknown };
	if (w.wscStreamDebug) return; // idempotent
	w.wscStreamDebug = {
		setUploadCap: (tier: string | null): void => setUploadCap(tier),
		setDownloadCap: (tier: string | null): void => setDownloadCap(tier),
		clear: (): void => clearStreamCaps(),
		status: (): void => streamCapsStatus()
	};
};
