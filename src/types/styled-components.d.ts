/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type Theme } from '@zextras/carbonio-design-system';

declare module 'styled-components' {
	// Augment DefaultTheme as suggested inside styled-components module
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	export interface DefaultTheme extends Theme {}
}
