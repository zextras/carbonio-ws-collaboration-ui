/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fireEvent, screen, act, renderHook } from '@testing-library/react';

import useLoadFiles from './useLoadFiles';
import { FILE_DESCRIPTION_CHAR_LIMIT } from '../constants/messageConstants';
import useStore from '../store/Store';
import { createMockRoom } from '../tests/createMock';
import { ProvidersWrapper } from '../tests/test-utils';

const room = createMockRoom();

const file1 = new File([''], 'file.txt', { type: 'text/plain' });
const file2 = new File([''], 'image.jpg', { type: 'image/jpeg' });

const filelist1 = [file1] as unknown as FileList;
const filelist2 = [file1, file2] as unknown as FileList;

const setInputWithTextContent = (textContent: string): void => {
	const textAreaComposer = document.createElement('textarea');
	textAreaComposer.setAttribute('data-testid', 'textAreaComposer');
	document.body.appendChild(textAreaComposer);
	textAreaComposer.textContent = textContent;
};

beforeEach(() => {
	const store = useStore.getState();
	store.addRoom(room);
	store.setInputHasFocus(room.id, true);
	document.body.innerHTML = '';
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

	test('The file is loaded on store if the input is shorter than FILE_DESCRIPTION_CHAR_LIMIT', () => {
		const { result } = renderHook(() => useLoadFiles(room.id), { wrapper: ProvidersWrapper });
		setInputWithTextContent('a'.repeat(FILE_DESCRIPTION_CHAR_LIMIT - 1));
		act(() => {
			result.current(filelist1);
		});
		expect(useStore.getState().activeConversations[room.id].filesToAttach).toHaveLength(1);
	});

	test('User clicls on Attach anyway in the confirmation modal', async () => {
		const { result } = renderHook(() => useLoadFiles(room.id), { wrapper: ProvidersWrapper });
		setInputWithTextContent('a'.repeat(FILE_DESCRIPTION_CHAR_LIMIT + 1));
		act(() => {
			result.current(filelist1);
		});
		const button = screen.getByText('Attach anyway');
		expect(button).toBeInTheDocument();

		fireEvent.click(button);

		const activeConversation = useStore.getState().activeConversations[room.id];
		expect(activeConversation.filesToAttach).toHaveLength(1);
	});

	test('User clicks on close icon in the confirmation modal', async () => {
		const { result } = renderHook(() => useLoadFiles(room.id), { wrapper: ProvidersWrapper });
		setInputWithTextContent('a'.repeat(FILE_DESCRIPTION_CHAR_LIMIT + 1));
		act(() => {
			result.current(filelist1);
		});
		const closeButton = screen.getByTestId('icon: Close');
		expect(closeButton).toBeInTheDocument();

		fireEvent.click(closeButton);

		const activeConversation = useStore.getState().activeConversations[room.id];
		expect(activeConversation?.filesToAttach).toBeUndefined();
	});
});
