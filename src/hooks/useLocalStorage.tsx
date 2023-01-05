/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useState } from 'react';

type ReturnType<T> = [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>];

const useLocalStorage = <T,>(key: string, initialValue?: T): ReturnType<T> => {
	const [localStorageItem, setLocalStorageItem] = useState<T | undefined>(() => {
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			return initialValue;
		}
	});

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
