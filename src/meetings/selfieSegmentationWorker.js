/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

let globalTimer;

self.onmessage = (e) => {
	switch (e.data.type) {
		case 'start':
			self.postMessage('workerStarted');
			break;
		case 'frameUpdateTimer':
			if (globalTimer) {
				clearInterval(globalTimer);
			}
			globalTimer = setInterval(() => {
				self.postMessage('update');
			}, 1000 / 30);
			break;
		case 'stop':
			clearInterval(globalTimer);
			globalTimer = null;
			break;
		default:
			break;
	}
};
