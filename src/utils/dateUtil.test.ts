/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import moment from 'moment-timezone';

import { dateString } from './dateUtil';
import useStore from '../store/Store';

describe('date utils', () => {
	test('given two dates, the function will return the right string', () => {
		const store = useStore.getState();
		const timezone = store.session.userPrefTimeZone;

		// actual date
		// should return today
		const actualDate = moment.tz();
		const todayString = dateString(+actualDate, timezone);
		expect(todayString).toBe('Today');

		// date minus almost 1 day
		// should return yesterday
		const minusAlmost1Date = +actualDate - 90000000;
		const almostYesterdayString = dateString(+minusAlmost1Date, timezone);
		expect(almostYesterdayString).toBe('Yesterday');

		// date minus 1 day
		// should return yesterday
		const minus1Date = +actualDate - 86400000;
		const yesterdayString = dateString(+minus1Date, timezone);
		expect(yesterdayString).toBe('Yesterday');

		// date minus 3 days, 23 hours, 59 min, 50 sec
		// should return a day of a week
		const minusAlmost4Date = +actualDate - 345599000;
		const almost4DaysString = dateString(+minusAlmost4Date, timezone);
		expect(almost4DaysString).toBe(moment.tz(minusAlmost4Date, timezone).format('dddd'));

		// date minus 4 days
		// should return a day of the week
		const minus4Date = +actualDate - 345600000;
		const fourDaysString = dateString(+minus4Date, timezone);
		expect(fourDaysString).toBe(moment.tz(minus4Date, timezone).format('dddd'));

		// to check if the date are the same
		expect(almost4DaysString).toBe(fourDaysString);

		// date minus 7 days
		// should return a complete date
		const minus7Date = +actualDate - 604800000;
		const sevenDaysString = dateString(+minus7Date, timezone);
		expect(sevenDaysString).toBe(moment.tz(minus7Date, timezone).format('MMMM D YYYY'));

		// date minus one year
		// should return a complete date
		const oneYearBefore = +actualDate - 31536000000;
		const oneYearString = dateString(+oneYearBefore, timezone);
		expect(oneYearString).toBe(moment.tz(oneYearBefore, timezone).format('MMMM D YYYY'));
	});
});
