/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	dateString,
	dateToISODate,
	dateToTimestamp,
	formatDate,
	now,
	setDateDefault
} from './dateUtils';

beforeEach(() => {
	setDateDefault('Europe/Rome', 'it');
});
describe('date utils', () => {
	describe('formatDate', () => {
		test('Timestamp is converted in a string with "YYYY-MM-DD" format', () => {
			expect(formatDate(1690745401000, 'YYYY-MM-DD')).toBe('2023-07-30');
		});

		test('Timestamp is converted in a string with "YYYY-MM-DD HH:mm:ss" format', () => {
			expect(formatDate(1690745401000, 'YYYY-MM-DD HH:mm:ss')).toBe('2023-07-30 21:30:01');
		});

		test('Date object is converted in a string with "YYYY-MM-DD" format', () => {
			expect(formatDate(new Date(1690745401000), 'YYYY-MM-DD')).toBe('2023-07-30');
		});

		test('Date object is converted in a string with "YYYY-MM-DD HH:mm:ss" format', () => {
			expect(formatDate(new Date(1690745401000), 'YYYY-MM-DD HH:mm:ss')).toBe(
				'2023-07-30 21:30:01'
			);
		});

		test('ISO date is converted in a string with "YYYY-MM-DD" format', () => {
			expect(formatDate('2023-07-30T21:30:01.000Z', 'YYYY-MM-DD')).toBe('2023-07-30');
		});

		test('ISO date is converted in a string with "YYYY-MM-DD HH:mm:ss" format', () => {
			expect(formatDate('2023-07-30T21:30:01.000Z', 'YYYY-MM-DD HH:mm:ss')).toBe(
				'2023-07-30 23:30:01'
			);
		});
	});

	describe('dateToTimestamp', () => {
		test('Date object is converted in a unix timestamp', () => {
			expect(dateToTimestamp(new Date(1690745401000))).toBe(1690745401000);
		});

		test('ISO date is converted in a unix timestamp', () => {
			expect(dateToTimestamp('2023-07-30T21:30:01.000+02:00')).toBe(1690745401000);
		});
	});

	describe('dateToISODate', () => {
		test('Unix timestamp is converted in a ISO date', () => {
			expect(dateToISODate(1690745401000)).toBe('2023-07-30T21:30:01.000+02:00');
		});

		test('Date object is converted in a ISO date', () => {
			expect(dateToISODate(new Date(1690745401000))).toBe('2023-07-30T21:30:01.000+02:00');
		});
	});

	describe('dateString', () => {
		const oneMinute = 1000 * 60;
		const oneHour = oneMinute * 60;
		const oneDay = oneHour * 24;

		test('1 hour ago is today', () => {
			const differenceDate = now() - oneHour;
			expect(dateString(differenceDate)).toBe('Today');
		});

		test('Almost 1 day ago is yesterday', () => {
			const differenceDate = now() - oneDay - oneMinute * 2;
			expect(dateString(differenceDate)).toBe('Yesterday');
		});

		test('30 hours ago is yesterday', () => {
			const differenceDate = now() - oneDay - oneHour * 6;
			expect(dateString(differenceDate)).toBe('Yesterday');
		});

		test('3 days, 23 hours, 59 min, 50 sec ago is a day of a week', () => {
			const differenceDate = now() - oneDay * 3 - oneHour * 23 - oneMinute * 59 - 50000;
			expect(dateString(differenceDate)).toMatch(
				/(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)/
			);
		});

		test('4 days ago is a day of a week', () => {
			const differenceDate = now() - oneDay * 4;
			expect(dateString(differenceDate)).toMatch(
				/(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)/
			);
		});

		test('7 days ago is a complete date', () => {
			const differenceDate = now() - oneDay * 7;
			expect(dateString(differenceDate)).toMatch(
				// eslint-disable-next-line max-len
				/([gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre])\s\d{1,2}\s\d{4}/
			);
		});

		test('1 year ago is a complete date', () => {
			const differenceDate = now() - oneDay * 365;
			expect(dateString(differenceDate)).toMatch(
				// eslint-disable-next-line max-len
				/([gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre])\s\d{1,2}\s\d{4}/
			);
		});
	});
});
