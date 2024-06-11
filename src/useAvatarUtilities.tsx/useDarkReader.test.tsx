/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';

import useDarkReader from './useDarkReader';
import {
	mockDarkReaderDisable,
	mockDarkReaderEnable,
	mockDarkReaderIsEnabled
} from '../../__mocks__/darkreader';
import { MEETINGS_PATH } from '../constants/appConstants';

describe('useDarkReader tests', () => {
	test('darkReaderStatus is undefined when DarkReader library status is undefined', () => {
		const { result } = renderHook(() => useDarkReader());
		expect(result.current.darkReaderStatus).toBeUndefined();
	});

	test('darkReaderStatus is true when DarkReader library status is true', () => {
		mockDarkReaderIsEnabled.mockReturnValue(true);
		const { result } = renderHook(() => useDarkReader());
		expect(result.current.darkReaderStatus).toBeTruthy();
	});

	test('darkReaderStatus is false when DarkReader library status is false', () => {
		mockDarkReaderIsEnabled.mockReturnValue(false);
		const { result } = renderHook(() => useDarkReader());
		expect(result.current.darkReaderStatus).toBeFalsy();
	});

	test("darkReaderMode is 'enabled' when in meeting tab even if user settings are different", () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}meetingId`;
		const { result } = renderHook(() => useDarkReader());
		expect(result.current.darkReaderMode).toBe('enabled');
	});

	test('enableDarkReader calls DarkReader library enable function', () => {
		const { result } = renderHook(() => useDarkReader());
		result.current.enableDarkReader();
		expect(mockDarkReaderEnable).toHaveBeenCalled();
	});

	test('disableDarkReader calls DarkReader library disable function', () => {
		const { result } = renderHook(() => useDarkReader());
		result.current.disableDarkReader();
		expect(mockDarkReaderDisable).toHaveBeenCalled();
	});
});
