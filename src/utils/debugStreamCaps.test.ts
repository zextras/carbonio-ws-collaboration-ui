/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	clearStreamCaps,
	getDownloadCap,
	getUploadCapSubstream,
	installStreamDebugHook,
	setDownloadCap,
	setUploadCap
} from './debugStreamCaps';

const applyDebugUploadCap = vi.fn();

vi.mock('../store/Store', () => ({
	default: {
		getState: (): unknown => ({
			activeMeeting: { videoOutConn: { applyDebugUploadCap } }
		})
	}
}));

describe('debugStreamCaps', () => {
	beforeEach(() => {
		clearStreamCaps();
		applyDebugUploadCap.mockClear();
		delete (window as unknown as { wscStreamDebug?: unknown }).wscStreamDebug;
	});

	afterEach(() => {
		clearStreamCaps();
	});

	describe('upload cap parsing', () => {
		it('maps LOW/MEDIUM/HIGH to rid-index ceiling 0/1/2', () => {
			setUploadCap('LOW');
			expect(getUploadCapSubstream()).toBe(0);
			setUploadCap('MEDIUM');
			expect(getUploadCapSubstream()).toBe(1);
			setUploadCap('HIGH');
			expect(getUploadCapSubstream()).toBe(2);
		});

		it('is case-insensitive and trims', () => {
			setUploadCap('  medium ');
			expect(getUploadCapSubstream()).toBe(1);
		});

		it('AUTO and null clear the upload cap', () => {
			setUploadCap('LOW');
			setUploadCap('AUTO');
			expect(getUploadCapSubstream()).toBeNull();
			setUploadCap('LOW');
			setUploadCap(null);
			expect(getUploadCapSubstream()).toBeNull();
		});

		it('ignores an invalid tier and warns, keeping the previous value', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
			setUploadCap('MEDIUM');
			setUploadCap('ULTRA');
			expect(getUploadCapSubstream()).toBe(1);
			expect(warn).toHaveBeenCalled();
			warn.mockRestore();
		});

		it('pushes the cap to the live outbound connection immediately', () => {
			setUploadCap('LOW');
			expect(applyDebugUploadCap).toHaveBeenLastCalledWith(0);
			setUploadCap('AUTO');
			expect(applyDebugUploadCap).toHaveBeenLastCalledWith(null);
		});
	});

	describe('download cap parsing', () => {
		it('maps LOW/MEDIUM/HIGH to rung ceiling 1/3/5 and OFF to OFF', () => {
			setDownloadCap('LOW');
			expect(getDownloadCap()).toBe(1);
			setDownloadCap('MEDIUM');
			expect(getDownloadCap()).toBe(3);
			setDownloadCap('HIGH');
			expect(getDownloadCap()).toBe(5);
			setDownloadCap('OFF');
			expect(getDownloadCap()).toBe('OFF');
		});

		it('AUTO clears the download cap', () => {
			setDownloadCap('MEDIUM');
			setDownloadCap('AUTO');
			expect(getDownloadCap()).toBeNull();
		});

		it('ignores an invalid tier and warns', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
			setDownloadCap('POTATO');
			expect(getDownloadCap()).toBeNull();
			expect(warn).toHaveBeenCalled();
			warn.mockRestore();
		});

		it('does NOT push to any live connection (pulled per tick)', () => {
			setDownloadCap('LOW');
			expect(applyDebugUploadCap).not.toHaveBeenCalled();
		});
	});

	describe('clearStreamCaps', () => {
		it('resets both caps to null (upload re-activated on the live connection)', () => {
			setUploadCap('LOW');
			setDownloadCap('OFF');
			applyDebugUploadCap.mockClear();
			clearStreamCaps();
			expect(getUploadCapSubstream()).toBeNull();
			expect(getDownloadCap()).toBeNull();
			expect(applyDebugUploadCap).toHaveBeenLastCalledWith(null);
		});
	});

	describe('installStreamDebugHook', () => {
		it('attaches window.wscStreamDebug with the four methods', () => {
			installStreamDebugHook();
			const hook = (window as unknown as { wscStreamDebug: Record<string, unknown> })
				.wscStreamDebug;
			expect(typeof hook.setUploadCap).toBe('function');
			expect(typeof hook.setDownloadCap).toBe('function');
			expect(typeof hook.clear).toBe('function');
			expect(typeof hook.status).toBe('function');
		});

		it('is idempotent (a second call keeps the same object)', () => {
			installStreamDebugHook();
			const first = (window as unknown as { wscStreamDebug: unknown }).wscStreamDebug;
			installStreamDebugHook();
			const second = (window as unknown as { wscStreamDebug: unknown }).wscStreamDebug;
			expect(first).toBe(second);
		});

		it('routes window.wscStreamDebug.setDownloadCap through to the module state', () => {
			installStreamDebugHook();
			(
				window as unknown as { wscStreamDebug: { setDownloadCap: (t: string) => void } }
			).wscStreamDebug.setDownloadCap('MEDIUM');
			expect(getDownloadCap()).toBe(3);
		});
	});
});
