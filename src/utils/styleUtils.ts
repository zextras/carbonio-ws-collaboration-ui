/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parseToHsl, toColorString } from 'polished';
import { HslColor } from 'polished/lib/types/color';
import { DefaultTheme } from 'styled-components';

export const calculateAvatarColor = (label: string): keyof DefaultTheme['avatarColors'] => {
	let sum = 0;
	// eslint-disable-next-line no-plusplus
	for (let i = 0; i < label.length; i++) {
		sum += label.charCodeAt(i);
	}
	return `avatar_${(sum % 50) + 1}`;
};

export function calcAvatarMeetingColor(fromColor: string): string {
	const fromHsl = parseToHsl(fromColor);
	const highlightRegular: HslColor = {
		hue: Math.round(fromHsl.hue) + 1,
		saturation: (Math.round(fromHsl.saturation * 100) - 1) / 100,
		lightness: Math.min(Math.round(fromHsl.lightness * 100 - 40), 90) / 100
	};
	return toColorString(highlightRegular);
}

export const calcScaleDivisor = (): number => {
	const localStorage = window.parent.localStorage.getItem('settings');
	if (localStorage) {
		const settingsStorage = JSON.parse(localStorage)['settings.appearance_setting.scaling'];
		const percentage = 100 - settingsStorage;
		const proportionalNumber = (16 * percentage) / 100;
		return 16 - proportionalNumber;
	}
	return 16;
};
