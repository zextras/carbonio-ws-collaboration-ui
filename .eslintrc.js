/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

module.exports = {
	extends: ['./node_modules/@zextras/carbonio-ui-configs/rules/eslint.js'],
	// parser: ['@typescript-eslint/parser'],
	plugins: [
		'unused-imports',
		'jest-dom',
		'import',
		'testing-library',
		'@typescript-eslint',
		'notice'
	],
	overrides: [
		{
			// enable eslint-plugin-testing-library rules or preset only for test files
			files: [
				'**/__tests__/**/*.[jt]s?(x)',
				'**/?(*.)+(spec|test).[jt]s?(x)',
				'**/utils/test-utils.tsx',
				'jest-setup.ts'
			],
			extends: ['plugin:jest-dom/recommended', 'plugin:testing-library/react'],
			rules: {
				'testing-library/no-global-regexp-flag-in-query': 'error',
				'testing-library/prefer-user-event': 'warn',
				'import/no-extraneous-dependencies': 'off',
				'testing-library/no-node-access': 'off',
				'jest-dom/prefer-in-document': 'off',
				'jest-dom/prefer-enabled-disabled': 'off'
			}
		}
	],
	rules: {
		camelcase: 'off',
		'brace-style': 'off',
		'no-console': 'off',
		'no-prototype-builtins': 'off',
		eqeqeq: ['error', 'smart'],
		'react/jsx-wrap-multilines': 'warn',
		'no-shadow': 'off',
		'@typescript-eslint/no-shadow': ['off'],
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': 'error',
		'prefer-const': [
			'error',
			{
				destructuring: 'all'
			}
		],
		'react/jsx-no-useless-fragment': 'error',
		'import/no-unresolved': 'off',
		'import/named': 'off',
		'import/namespace': 'off',
		'import/no-named-as-default': 'off',
		'import/export': 'warn',
		'import/no-cycle': 'off',
		'no-nested-ternary': 'off',
		'class-methods-use-this': 'off',
		'react/jsx-no-bind': [
			'warn',
			{
				allowArrowFunctions: true
			}
		],
		'import/order': [
			'error',
			{
				groups: [['builtin', 'external']],
				pathGroups: [
					{
						pattern: 'react',
						group: 'external',
						position: 'before'
					}
				],
				'newlines-between': 'always',
				alphabetize: {
					order: 'asc',
					caseInsensitive: true
				}
			}
		],
		'notice/notice': [
			'error',
			{
				templateFile: './notice.template.ts'
			}
		]
	},
	settings: {
		react: {
			version: 'detect'
		}
	},
	ignorePatterns: ['notice.template.ts']
};
