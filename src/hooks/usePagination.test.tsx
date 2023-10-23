/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';

import usePagination from './usePagination';

describe('usePagination custom hook', () => {
	describe('Go to the next page until the end', () => {
		test('3 rows - 2 rows in the page', () => {
			const { result } = renderHook(() => usePagination(3, 2));
			expect(result.current.prevButton.disabled).toEqual(true);

			act(() => result.current.nextButton.onClick());
			expect(result.current.rowIndex).toEqual(1);
			expect(result.current.nextButton.disabled).toEqual(true);
		});

		test('5 rows - 1 rows in the page', () => {
			const { result } = renderHook(() => usePagination(5, 1));
			act(() => {
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
			});

			expect(result.current.rowIndex).toEqual(4);
			expect(result.current.nextButton.disabled).toEqual(true);
		});

		test('5 rows - 2 rows in the page ', () => {
			const { result } = renderHook(() => usePagination(5, 2));
			act(() => {
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
			});
			expect(result.current.rowIndex).toEqual(3);
			expect(result.current.nextButton.disabled).toEqual(true);
		});

		test('5 rows - 2 rows in the page - 3 step ', () => {
			const { result } = renderHook(() => usePagination(5, 2, 3));
			act(() => result.current.nextButton.onClick());
			expect(result.current.rowIndex).toEqual(3);
			expect(result.current.nextButton.disabled).toEqual(true);
		});
	});

	describe('Go to the previous page until the end', () => {
		test('3 rows - 2 rows in the page', () => {
			const { result } = renderHook(() => usePagination(3, 2));
			expect(result.current.prevButton.disabled).toEqual(true);

			act(() => {
				result.current.nextButton.onClick();
				result.current.prevButton.onClick();
			});
			expect(result.current.rowIndex).toEqual(0);
		});

		test('5 rows - 1 rows in the page', () => {
			const { result } = renderHook(() => usePagination(5, 1));
			act(() => {
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
				result.current.prevButton.onClick();
				result.current.prevButton.onClick();
				result.current.prevButton.onClick();
				result.current.prevButton.onClick();
			});

			expect(result.current.rowIndex).toEqual(0);
			expect(result.current.prevButton.disabled).toEqual(true);
		});

		test('5 rows - 2 rows in the page ', () => {
			const { result } = renderHook(() => usePagination(5, 2));
			act(() => {
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
				result.current.nextButton.onClick();
				result.current.prevButton.onClick();
				result.current.prevButton.onClick();
				result.current.prevButton.onClick();
			});
			expect(result.current.rowIndex).toEqual(0);
			expect(result.current.prevButton.disabled).toEqual(true);
		});

		test('5 rows - 2 rows in the page - 3 step ', () => {
			const { result } = renderHook(() => usePagination(5, 2, 3));
			act(() => {
				result.current.nextButton.onClick();
				result.current.prevButton.onClick();
			});
			expect(result.current.rowIndex).toEqual(0);
			expect(result.current.prevButton.disabled).toEqual(true);
		});
	});
});
