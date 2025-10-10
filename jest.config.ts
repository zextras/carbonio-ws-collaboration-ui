/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
export default {
	// Automatically clear mock calls, instances, contexts and results before every test
	clearMocks: true,
	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: true,
	// An array of glob patterns indicating a set of files for which coverage information should be collected
	collectCoverageFrom: ['src/**/*.{js,ts}(x)?', '!src/types/**', '!src/tests/**'],
	// The directory where Jest should output its coverage files
	coverageDirectory: 'coverage',
	// An array of regexp pattern strings used to skip coverage collection
	coveragePathIgnorePatterns: [
		'/src/meetings/components/virtualBackground/SelfieSegmentationManager.ts',
		'/src/meetings/components/virtualBackground/selfieSegmentationWorker.js'
	],
	// Indicates which provider should be used to instrument code for coverage
	coverageProvider: 'babel',
	// A list of reporter names that Jest uses when writing coverage reports
	coverageReporters: ['text', 'cobertura', 'lcov'],
	// The default configuration for fake timers
	fakeTimers: {
		enableGlobally: true
	},
	// The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
	// maxWorkers: 2,
	// An array of directory names to be searched recursively up from the requiring module's location
	moduleDirectories: ['node_modules', 'utils'],
	// A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
	moduleNameMapper: {
		'^react-pdf': 'react-pdf/dist/cjs/entry.jest',
		'\\.(css|less)$': './__mocks__/styleMock.js',
		'\\.(binarypb|tflite|wasm)$': '<rootDir>/__mocks__/fileMock.js'
	},
	// Use this configuration option to add custom reporters to Jest
	reporters: ['default', 'jest-junit'],
	// Automatically reset mock state before every test
	resetMocks: true,
	// Automatically restore mock state and implementation before every test
	restoreMocks: true,
	// A list of paths to modules that run some code to configure or set up the testing framework before each test
	setupFilesAfterEnv: [
		'<rootDir>/src/tests/jest-env-setup.ts',
		'<rootDir>/src/tests/mocks/index.ts'
	],
	// The test environment that will be used for testing
	testEnvironment: 'jsdom',
	// A map from regular expressions to paths to transformers
	transform: {
		'^.+\\.[t|j]sx?$': ['babel-jest', { configFile: './babel.config.jest.js' }],
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|ogg|m4a|aac|oga)$':
			'<rootDir>/src/tests/fileTransformer.js'
	},
	// An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
	transformIgnorePatterns: [
		`/node_modules/(?!(${['@zextras/carbonio-ui-preview', 'pdfjs-dist', 'uuid'].join('|')}))`,
		'\\.pnp\\.[^\\/]+$',
		'/node_modules/@mediapipe/selfie_segmentation/selfie_segmentation\\.(binarypb|tflite|wasm)$'
	]
};
