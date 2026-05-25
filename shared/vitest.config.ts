/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true
	},
	cacheDir: '../node_modules/.vite'
});
