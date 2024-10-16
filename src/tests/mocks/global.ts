/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Define browser objects that aren't available in Jest
// https://jestjs.io/docs/en/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom

export const fetchResponse: jest.Mock = jest.fn(() => ({}));
export const fetchTextResponse: jest.Mock = jest.fn(() => '{}');
export const requestFullscreen = jest.fn();

Object.defineProperty(global, 'fetch', {
	value: jest.fn(() =>
		Promise.resolve({
			json: () => fetchResponse(),
			text: () => fetchTextResponse(),
			ok: true,
			headers: { get: (): string => 'application/json' }
		})
	)
});

Object.defineProperty(global, 'URL', {
	value: {
		createObjectURL: jest.fn()
	}
});

export const mockedDevicesList = jest.fn(() => [
	{
		deviceId: 'audioDefault',
		kind: 'audioinput',
		label: 'Audio Default',
		groupId: 'default'
	},
	{
		deviceId: 'audioDevice1',
		kind: 'audioinput',
		label: 'Audio Device 1',
		groupId: 'device1'
	},
	{
		deviceId: 'audioDevice2',
		kind: 'audioinput',
		label: 'Audio Device 2',
		groupId: 'device2'
	},
	{
		deviceId: 'videoDefault',
		kind: 'videoinput',
		label: 'Video Default',
		groupId: 'default'
	},
	{
		deviceId: 'videoDevice 1',
		kind: 'videoinput',
		label: 'Video Device 1',
		groupId: 'device1'
	},
	{
		deviceId: 'videoDevice 2',
		kind: 'videoinput',
		label: 'Video Device 2',
		groupId: 'device2'
	}
]);

export const mockMediaDevicesResolve = jest.fn(() => {
	Object.defineProperty(global.navigator, 'mediaDevices', {
		value: {
			getUserMedia: jest.fn(() =>
				Promise.resolve({
					getTracks: jest.fn(() => ({ forEach: jest.fn() })),
					getAudioTracks: jest.fn(() => ({ forEach: jest.fn() })),
					getVideoTracks: jest.fn(() => ({ forEach: jest.fn() }))
				})
			),
			enumerateDevices: jest.fn(() => Promise.resolve(mockedDevicesList())),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn()
		}
	});
});

export const mockedGetUserMedia = jest.fn();
export const mockedEnumerateDevices = jest.fn();

export const mockMediaDevicesReject = jest.fn(() => {
	Object.defineProperty(global.navigator, 'mediaDevices', {
		value: {
			getUserMedia: jest.fn(
				() =>
					new Promise((resolve, reject) => {
						const result = mockedGetUserMedia();
						result ? resolve(result) : reject(new Error());
					})
			),
			enumerateDevices: jest.fn(
				() =>
					new Promise((resolve, reject) => {
						const result = mockedEnumerateDevices();
						result ? resolve(result) : reject(new Error());
					})
			),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn()
		}
	});
});

Object.defineProperty(global.navigator, 'userAgent', {
	value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0'
});

Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
	set: jest.fn()
});

Object.defineProperty(window, 'RTCPeerConnection', {
	value: jest.fn(() => ({
		addTrack: jest.fn(),
		createAnswer: jest.fn(() => Promise.resolve({ sdp: '', type: 'answer' })),
		setRemoteDescription: jest.fn(() => Promise.resolve()),
		setLocalDescription: jest.fn(() => Promise.resolve())
	}))
});

Object.defineProperty(window, 'RTCSessionDescription', {
	value: jest.fn(() => ({
		sdp: 'sdp',
		type: 'offer'
	}))
});

Object.defineProperty(window, 'AudioContext', {
	writable: true,
	value: jest.fn(() => ({
		createOscillator: (): any => ({
			connect: () => ({
				stream: {
					getAudioTracks: () => [MediaStream]
				}
			}),
			start: jest.fn()
		}),
		createMediaStreamDestination: jest.fn()
	}))
});

Object.defineProperty(window, 'MediaStream', {
	writable: true,
	value: jest.fn(() => ({
		stream: (): any => ({
			getAudioTracks: jest.fn(),
			getVideoTracks: jest.fn(),
			addTrack: jest.fn()
		}),
		getAudioTracks: (): any[] => [MediaStream],
		getVideoTracks: (): any[] => [MediaStream],
		addTrack: jest.fn()
	}))
});

Object.defineProperty(window, 'open', {
	value: jest.fn()
});

// This mock makes uuid/v4 to always generate the same uuid "00000000-0000-4000-8000-000000000000"
Object.defineProperty(window, 'crypto', {
	value: {
		getRandomValues: (arr: string[]) => {
			const byteValues = new Uint8Array(arr.length);
			byteValues.fill(0);
			return byteValues;
		}
	}
});

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // Deprecated
		removeListener: jest.fn(), // Deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn()
	}))
});

export const intersectionObserverMockObserve = jest.fn();
export const intersectionObserverMockDisconnect = jest.fn();
Object.defineProperty(window, 'IntersectionObserver', {
	writable: true,
	value: jest.fn().mockImplementation((callback, options) => ({
		thresholds: options.threshold,
		root: options.root,
		rootMargin: options.rootMargin,
		observe: intersectionObserverMockObserve,
		unobserve: jest.fn(),
		disconnect: intersectionObserverMockDisconnect
	}))
});

Object.defineProperty(window, 'ResizeObserver', {
	writable: true,
	value: jest.fn().mockImplementation(() => ({
		observe: jest.fn(),
		unobserve: jest.fn(),
		disconnect: jest.fn()
	}))
});

window.resizeTo = function resizeTo(width: number, height: number): void {
	Object.assign(this, {
		innerWidth: width,
		innerHeight: height,
		outerWidth: width,
		outerHeight: height
	}).dispatchEvent(new this.Event('resize'));
};

Object.defineProperty(document.documentElement, 'requestFullscreen', {
	value: jest.fn()
});

export const mockPlayAudio = jest.fn();
global.Audio = jest.fn().mockImplementation(() => ({
	play: mockPlayAudio
}));

export const mockReplace = jest.fn();
Object.defineProperty(window, 'location', {
	value: {
		href: 'https://localhost/carbonio/',
		pathname: 'https://localhost/carbonio/',
		replace: mockReplace,
		includes: jest.fn()
	},
	writable: true
});

export const mockWebSocketSend = jest.fn();
export const mockWebSocketClose = jest.fn();
Object.defineProperty(global, 'WebSocket', {
	value: jest.fn(() => ({
		readyState: 1,
		send: mockWebSocketSend,
		close: mockWebSocketClose
	}))
});

export const mockAttachmentTagElement = document.createElement('a');

// web worker mock
class Worker {
	url: string;

	onmessage: (msg: { data: string }) => void;

	constructor(stringUrl: string) {
		this.url = stringUrl;
		this.onmessage = (): void => {};
	}

	postMessage(msg: { type: string }): void {
		switch (msg.type) {
			case 'start':
				this.onmessage({ data: 'workerStarted' });
				break;
			case 'frameUpdateTimer':
				this.onmessage({ data: 'update' });
				break;
			case 'stop':
				break;
			default:
				break;
		}
	}
}

Object.defineProperty(window, 'Worker', {
	writable: true,
	value: Worker
});

HTMLCanvasElement.prototype.getContext = jest.fn();
