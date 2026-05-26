/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO define type
// export interface ISharedCodeDependencies {}

type ISharedCodeDependencies = any;

let sharedCodeDependencies: ISharedCodeDependencies | undefined;

export const configureSharedCode = (deps: ISharedCodeDependencies): void => {
	sharedCodeDependencies = deps;
};

export const getSharedCodeConfig = (): ISharedCodeDependencies => {
	if (!sharedCodeDependencies) {
		throw new Error(
			'Shared dependencies not configured. Call configureSharedCode() before using the store.'
		);
	}
	return sharedCodeDependencies;
};
