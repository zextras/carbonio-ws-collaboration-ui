/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Define browser objects that aren't available in Jest
// https://jestjs.io/docs/en/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom

export const fetchResponse: jest.Mock = jest.fn(() => ({}));
export const requestFullscreen = jest.fn();

Object.defineProperty(global, 'fetch', {
	value: jest.fn(() =>
		Promise.resolve({
			json: () => fetchResponse(),
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

Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
	set: jest.fn()
});

Object.defineProperty(window, 'RTCPeerConnection', {
	value: jest.fn(() => ({
		addTrack: jest.fn()
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
			addTrack: jest.fn()
		}),
		getAudioTracks: (): any[] => [MediaStream],
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
