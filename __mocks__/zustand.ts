/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import { StateCreator, StoreApi, UseBoundStore, create as actualCreate } from 'zustand';

// a variable to hold reset functions for all stores declared in the app
const storeResetFns = new Set<() => void>();

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create =
	<S>() =>
	(createState: StateCreator<S>): UseBoundStore<StoreApi<S>> => {
		const store = actualCreate(createState);
		const initialState = store.getState();
		storeResetFns.add(() => {
			store.setState(initialState, true);
		});
		return store;
	};
// Reset all stores after each test run
afterEach(() => {
	act(() => storeResetFns.forEach((resetFn) => resetFn()));
});

export default create;
