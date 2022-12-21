/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface ThemeObj {
	windowObj: Window;
	breakpoints: {
		width: number;
		aspectRatio: number;
	};
	borderRadius: string;
	fonts: {
		default: string;
		weight: { light: number; regular: number; medium: number; bold: number };
	};
	sizes: {
		font: ThemeSizeObjExtended;
		icon: ThemeSizeObj;
		avatar: Omit<ThemeSizeObjExtended<{ diameter: string; font: string }>, 'extrasmall'>;
		padding: ThemeSizeObjExtended;
	};
	icons: Record<string, IconComponent>;
	loginBackground: string;
	logo: {
		svg: IconComponent;
		size: ThemeSizeObj;
	};
	palette: Record<
		| 'currentColor'
		| 'transparent'
		| 'primary'
		| 'secondary'
		| 'header'
		| 'highlight'
		| 'gray0'
		| 'gray1'
		| 'gray2'
		| 'gray3'
		| 'gray4'
		| 'gray5'
		| 'gray6'
		| 'warning'
		| 'error'
		| 'success'
		| 'info'
		| 'text',
		ThemeColorObj
	>;
	avatarColors: Record<`avatar_${number}`, string>;
}

declare module 'styled-components' {
	// Augment DefaultTheme as suggested inside styled-components module
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	export interface DefaultTheme extends ThemeObj {}
}
