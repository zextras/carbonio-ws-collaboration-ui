/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import useLoadFiles from './useLoadFiles';
import useStore from '../store/Store';
import { createMockRoom } from '../tests/createMock';
import { ProvidersWrapper } from '../tests/test-utils';

const room = createMockRoom();

const file1 = new File([''], 'file.txt', { type: 'text/plain' });
const file2 = new File([''], 'image.jpg', { type: 'image/jpeg' });

const filelist1 = [file1] as unknown as FileList;
const filelist2 = [file1, file2] as unknown as FileList;

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room]);
});
describe('useLoadFiles hook', () => {
	test('Set one file into store', () => {
		const { result } = renderHook(() => useLoadFiles(room.id), { wrapper: ProvidersWrapper });
		act(() => {
			result.current(filelist1);
		});
		expect(useStore.getState().activeConversations[room.id].filesToAttach).toHaveLength(1);
	});

	test('Set more than one file into store', () => {
		const { result } = renderHook(() => useLoadFiles(room.id), { wrapper: ProvidersWrapper });
		act(() => {
			result.current(filelist2);
		});
		expect(useStore.getState().activeConversations[room.id].filesToAttach).toHaveLength(2);
	});
});
