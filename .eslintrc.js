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
		'no-prototype-builtins': 'off',
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
		'import/no-unresolved': 'off',
		'import/namespace': 'off',
		'import/no-cycle': 'off',
		'no-nested-ternary': 'off',
		'class-methods-use-this': 'off',
		'react/jsx-no-bind': [
			'warn',
			{
				allowArrowFunctions: true
			}
		],
		'notice/notice': [
			'error',
			{
				templateFile: './notice.template.ts'
			}
		],
		'sonarjs/cognitive-complexity': 'warn'
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
