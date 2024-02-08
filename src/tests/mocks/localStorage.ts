/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type localStorageType = {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
};

const localStorageMock = ((): localStorageType => {
	const store: { [key: string]: string } = {};

	return {
		getItem: (key: string): string | null => store[key] || null,
		setItem: (key: string, value): void => {
			store[key] = value.toString();
		}
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});
