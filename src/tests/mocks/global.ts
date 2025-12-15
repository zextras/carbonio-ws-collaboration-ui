/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Define browser objects that aren't available in Jest
// https://jestjs.io/docs/en/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom

export const requestFullscreen = vi.fn();

// Object.defineProperty(global, 'URL', {
// 	value: {
// 		createObjectURL: vi.fn()
// 	}
// });
//
// Object.defineProperty(global.navigator, 'userAgent', {
// 	value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0'
// });
//
// Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
// 	set: vi.fn()
// });
//
//
// Object.defineProperty(window, 'open', {
// 	value: vi.fn()
// });
//
// // This mock makes uuid/v4 to always generate the same uuid "00000000-0000-4000-8000-000000000000"
// export const mockedUuid = '00000000-0000-4000-8000-000000000000';
// Object.defineProperty(window, 'crypto', {
// 	value: {
// 		getRandomValues: (arr: string[]) => {
// 			const byteValues = new Uint8Array(arr.length);
// 			byteValues.fill(0);
// 			return byteValues;
// 		}
// 	}
// });
//
// window.resizeTo = function resizeTo(width: number, height: number): void {
// 	Object.assign(this, {
// 		innerWidth: width,
// 		innerHeight: height,
// 		outerWidth: width,
// 		outerHeight: height
// 	}).dispatchEvent(new this.Event('resize'));
// };
//
// Object.defineProperty(document.documentElement, 'requestFullscreen', {
// 	value: vi.fn()
// });
//
// export const mockReplace = vi.fn();
//
// // web worker mock
// class Worker {
// 	url: string;
//
// 	onmessage: (msg: { data: string }) => void;
//
// 	constructor(stringUrl: string) {
// 		this.url = stringUrl;
// 		this.onmessage = (): void => {};
// 	}
//
// 	postMessage(msg: { type: string }): void {
// 		switch (msg.type) {
// 			case 'start':
// 				this.onmessage({ data: 'workerStarted' });
// 				break;
// 			case 'frameUpdateTimer':
// 				this.onmessage({ data: 'update' });
// 				break;
// 			case 'stop':
// 				break;
// 			default:
// 				break;
// 		}
// 	}
// }
//
// Object.defineProperty(window, 'Worker', {
// 	writable: true,
// 	value: Worker
// });
//
// HTMLCanvasElement.prototype.getContext = vi.fn();
