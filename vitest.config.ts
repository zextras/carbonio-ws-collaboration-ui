/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const retry = process.env.TEST_RETRY_TIMES ? parseInt(process.env.TEST_RETRY_TIMES, 10) : 2;
const isCI = process.env.CI === 'true';

export default defineConfig({
	plugins: [
		react({
			jsxImportSource: '@emotion/react',
			babel: {
				plugins: ['@emotion/babel-plugin']
			}
		})
	],
	test: {
		reporters: isCI ? ['default', 'junit'] : ['verbose'],
		outputFile: {
			junit: './junit.xml'
		},
		retry,
		environment: 'jsdom',
		environmentOptions: {
			jsdom: {
				url: 'http://localhost/'
			}
		},
		setupFiles: ['./src/tests/setupTests.ts'],
		restoreMocks: true,
		clearMocks: true,
		maxWorkers: isCI ? 2 : undefined,
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: isCI ? ['text', 'cobertura', 'lcov'] : ['text', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/tests/',
				'src/types',

				// Test files
				'**/*.test.{ts,tsx}',
				'**/*.spec.{ts,tsx}',

				// Type definitions
				'**/*.d.ts',

				// Test utilities
				'**/setupTests.{ts,tsx}',
				'**/testUtils.{ts,tsx}',
				'**/test-utils.{ts,tsx}'
			],
			thresholds: undefined
		},
		globals: true,
		testTimeout: 60000
	}
});
