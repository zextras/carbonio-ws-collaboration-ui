/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { now } from 'moment';
import moment from 'moment-timezone';

import { dateString, dateToISODate, dateToTimestamp, formatDate, setDateDefault } from './dateUtil';
import useStore from '../store/Store';

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
		const oneHour = 1000 * 60 * 60;

		test('1 hour ago', () => {
			const actualDate = now();
			const actualHourMoreOne = actualDate - oneHour;
			expect(dateString(actualHourMoreOne)).toBe('Today');
		});

		test('30 hours ago', () => {
			const actualDate = now();
			const actualDayMoreTwo = actualDate - oneHour * 30;
			expect(dateString(actualDayMoreTwo)).toBe('Yesterday');
		});
	});

	test('given two dates, the function will return the right string', () => {
		const store = useStore.getState();
		const timezone = store.session.userPrefTimeZone;

		// actual date
		// should return today
		const actualDate = moment.tz();
		const todayString = dateString(+actualDate);
		expect(todayString).toBe('Today');

		// date minus almost 1 day
		// should return yesterday
		const minusAlmost1Date = +actualDate - 90000000;
		const almostYesterdayString = dateString(+minusAlmost1Date);
		expect(almostYesterdayString).toBe('Yesterday');

		// date minus 1 day
		// should return yesterday
		const minus1Date = +actualDate - 86400000;
		const yesterdayString = dateString(+minus1Date);
		expect(yesterdayString).toBe('Yesterday');

		// date minus 3 days, 23 hours, 59 min, 50 sec
		// should return a day of a week
		const minusAlmost4Date = +actualDate - 345599000;
		const almost4DaysString = dateString(+minusAlmost4Date);
		expect(almost4DaysString).toBe(moment.tz(minusAlmost4Date, timezone).format('dddd'));

		// date minus 4 days
		// should return a day of the week
		const minus4Date = +actualDate - 345600000;
		const fourDaysString = dateString(+minus4Date);
		expect(fourDaysString).toBe(moment.tz(minus4Date, timezone).format('dddd'));

		// to check if the date are the same
		expect(almost4DaysString).toBe(fourDaysString);

		// date minus 7 days
		// should return a complete date
		const minus7Date = +actualDate - 604800000;
		const sevenDaysString = dateString(+minus7Date);
		expect(sevenDaysString).toBe(moment.tz(minus7Date, timezone).format('MMMM D YYYY'));

		// date minus one year
		// should return a complete date
		const oneYearBefore = +actualDate - 31536000000;
		const oneYearString = dateString(+oneYearBefore);
		expect(oneYearString).toBe(moment.tz(oneYearBefore, timezone).format('MMMM D YYYY'));
	});
});
