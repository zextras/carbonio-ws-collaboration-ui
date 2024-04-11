/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useState } from 'react';

import { getLocalStorageItem, LOCAL_STORAGE_NAMES } from '../utils/localStorageUtils';

type ReturnType<LocalStorageType> = [
	LocalStorageType,
	React.Dispatch<React.SetStateAction<LocalStorageType>>
];

const useLocalStorage = <LocalStorageType,>(
	key: LOCAL_STORAGE_NAMES
): ReturnType<LocalStorageType> => {
	const [localStorageItem, setLocalStorageItem] = useState<LocalStorageType>(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		getLocalStorageItem(key)
	);

	useEffect(() => {
		if (localStorageItem) {
			try {
				localStorage.setItem(key, JSON.stringify(localStorageItem));
			} catch (err) {
				console.log(err);
			}
		}
	}, [localStorageItem, key]);
	return [localStorageItem, setLocalStorageItem];
};

export default useLocalStorage;
