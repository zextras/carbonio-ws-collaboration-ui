/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

module.exports = {
	extends: ['./node_modules/@zextras/carbonio-ui-configs/rules/eslint.js'],
	plugins: ['import', 'notice'],
	rules: {
		camelcase: 'off',
		'no-console': 'off',
		eqeqeq: ['error', 'smart'],
		'react/jsx-wrap-multilines': 'warn',
		'@typescript-eslint/no-shadow': ['off'],
		'prefer-const': [
			'error',
			{
				destructuring: 'all'
			}
		],
		'react/jsx-no-useless-fragment': 'error',
		'import/no-cycle': 'off',
		'no-nested-ternary': 'warn',
		'class-methods-use-this': 'off',
		'notice/notice': [
			'error',
			{
				templateFile: './notice.template.ts'
			}
		],
		'sonarjs/cognitive-complexity': 'warn',
		'@typescript-eslint/no-explicit-any': 'warn'
	},
	overrides: [
		{
			files: [
				'**/__tests__/**/*.[jt]s?(x)',
				'**/?(*.)+(spec|test).[jt]s?(x)',
				'**/utils/test-utils.tsx',
				'jest-setup.ts'
			],
			rules: {
				'testing-library/no-node-access': 'off',
				'jest-dom/prefer-in-document': 'off',
				'import/no-extraneous-dependencies': 'off'
			}
		}
	],
	ignorePatterns: ['notice.template.ts']
};
