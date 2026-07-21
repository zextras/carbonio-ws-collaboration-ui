/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { dateString, dateToTimestamp, setDateDefault } from './dateUtils';

const date = 1690745401000;

beforeEach(() => {
	setDateDefault('it');
});
describe('date utils', () => {
	describe('dateToTimestamp', () => {
		test('Date object is converted in a unix timestamp', () => {
			expect(dateToTimestamp(new Date(date))).toBe(1690745401000);
		});

		test('ISO date is converted in a unix timestamp', () => {
			expect(dateToTimestamp('2023-07-30T21:30:01.000+02:00')).toBe(1690745401000);
		});
	});

	describe('dateString', () => {
		const now = new Date('2026-05-04T15:48:17Z');
		const oneMinute = 1000 * 60;
		const oneHour = oneMinute * 60;
		const oneDay = oneHour * 24;

		test('1 hour ago is today', () => {
			const differenceDate = now.getTime() - oneHour;
			expect(dateString(differenceDate, now)).toBe('Today');
		});

		test('Almost 1 day ago is yesterday', () => {
			const differenceDate = now.getTime() - oneDay - oneMinute * 2;
			expect(dateString(differenceDate, now)).toBe('Yesterday');
		});

		test('30 hours ago is yesterday', () => {
			const differenceDate = now.getTime() - oneDay - oneHour * 6;
			expect(dateString(differenceDate, now)).toBe('Yesterday');
		});

		test('3 days, 23 hours, 59 min, 50 sec ago is a day of a week', () => {
			const differenceDate = now.getTime() - oneDay * 3 - oneHour * 23 - oneMinute * 59 - 50000;
			expect(dateString(differenceDate, now)).toMatch(
				/(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)/
			);
		});

		test('4 days ago is a day of a week', () => {
			const differenceDate = now.getTime() - oneDay * 4;
			expect(dateString(differenceDate, now)).toMatch(
				/(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)/
			);
		});

		test('7 days ago is a complete date', () => {
			const differenceDate = now.getTime() - oneDay * 7;
			expect(dateString(differenceDate, now)).toMatch(
				// eslint-disable-next-line max-len
				/([gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre])\s\d{1,2}\s\d{4}/
			);
		});

		test('1 year ago is a complete date', () => {
			const differenceDate = now.getTime() - oneDay * 365;
			expect(dateString(differenceDate, now)).toMatch(
				// eslint-disable-next-line max-len
				/([gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre])\s\d{1,2}\s\d{4}/
			);
		});
	});
});
