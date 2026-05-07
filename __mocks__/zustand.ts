/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, cleanup } from '@testing-library/react';
import { StateCreator, StoreApi, UseBoundStore, create as actualCreate } from 'zustand';

import { WebSocketClient } from '../src/network/websocket/WebSocketClient';
import { RootStore } from '../src/types/store/StoreTypes';

// a variable to hold reset functions for all stores declared in the app
const storeResetFns = new Set<() => void>();

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create =
	() =>
	(createState: StateCreator<RootStore>): UseBoundStore<StoreApi<RootStore>> => {
		const store = actualCreate(createState);
		const initialState = store.getState();
		storeResetFns.add(() => {
			const resetStore = {
				...initialState,
				connections: {
					wsClient: new WebSocketClient(),
					status: {},
					isMongooseIM: undefined
				}
			};
			store.setState(resetStore, true);
		});
		return store;
	};

beforeEach(() => {
	act(() => {
		storeResetFns.forEach((resetFn) => resetFn());
	});
});

afterEach(() => {
	cleanup();
});

export default create;
