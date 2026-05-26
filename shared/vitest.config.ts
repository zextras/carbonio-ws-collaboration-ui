/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const sharedDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: [resolve(sharedDir, 'src/tests/setupTests.ts')],
		include: [resolve(sharedDir, 'src/**/*.test.{ts,tsx}')]
	},
	cacheDir: '../node_modules/.vite'
});
