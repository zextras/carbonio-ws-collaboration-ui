/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module '*.png' {
	const src: string;
	export default src;
}

declare module '*.mp3';

declare module '*.ogg';

// DEBUG-ONLY console hook for manual meeting stream-quality hard-caps (see utils/debugStreamCaps.ts).
interface Window {
	wscStreamDebug?: {
		setUploadCap: (tier: string | null) => void;
		setDownloadCap: (tier: string | null) => void;
		clear: () => void;
		status: () => void;
	};
}
