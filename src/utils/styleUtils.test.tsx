/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { calcScaleDivisor } from './styleUtils';

describe('calcTileScaleDivisor', () => {
	test('scale 100 returns 16', () => {
		localStorage.setItem(
			'settings',
			JSON.stringify({ 'settings.appearance_setting.scaling': 100 })
		);
		const result = calcScaleDivisor();
		expect(result).toBe(16);
	});
	test('scale 112.5 returns 18', () => {
		localStorage.setItem(
			'settings',
			JSON.stringify({ 'settings.appearance_setting.scaling': 112.5 })
		);
		const result = calcScaleDivisor();
		expect(result).toBe(18);
	});
	test('scale 125 returns 20', () => {
		localStorage.setItem(
			'settings',
			JSON.stringify({ 'settings.appearance_setting.scaling': 125 })
		);
		const result = calcScaleDivisor();
		expect(result).toBe(20);
	});
	test('scale 97.5 returns 14', () => {
		localStorage.setItem(
			'settings',
			JSON.stringify({ 'settings.appearance_setting.scaling': 87.5 })
		);
		const result = calcScaleDivisor();
		expect(result).toBe(14);
	});
	test('scale 75 returns 12', () => {
		localStorage.setItem('settings', JSON.stringify({ 'settings.appearance_setting.scaling': 75 }));
		const result = calcScaleDivisor();
		expect(result).toBe(12);
	});
});
