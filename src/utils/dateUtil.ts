/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import moment from 'moment-timezone';

export const now = (): number => moment().valueOf();

// Transform generic date format into Unix timestamp (milliseconds)
export const dateToTimestamp = (date: Date | string | number): number => moment(date).valueOf();

// Transform generic date format into ISO Date (format accept from XMPP)
export const dateToISODate = (date: Date | number | string): string => moment(date).toISOString();

export const displayTimestamp = (timestamp: Date | string | number): string =>
	moment(timestamp).format('HH:mm:ss DD-MM-YYYY');

export const isBefore = (previousDate: number | string, nextDate: number | string): boolean =>
	moment(previousDate).isSameOrBefore(nextDate);

// it returns if the two dates are in different days or months or years
export const datesAreFromTheSameDay = (date1: number | string, date2: number | string): boolean => {
	const prevDate = new Date(date1).toLocaleString('en-US', {
		month: 'numeric',
		day: 'numeric',
		year: 'numeric'
	});
	const actualDate = new Date(date2).toLocaleString('en-US', {
		month: 'numeric',
		day: 'numeric',
		year: 'numeric'
	});
	return prevDate !== actualDate;
};

// it transforms a ms date to a string one
export const dateString = (actualDate: string | number, timezone: string): string => {
	// date of today
	const today = moment().tz(timezone);
	// date in exam
	const dateDay = moment.tz(actualDate, timezone);
	// date of six days before today
	const dateSixDaysBefore = moment(today).subtract(6, 'days');

	// the date in exam and today are the same date
	const isSameDay = dateDay.isSame(today, 'day');
	// the date in exam and yesterday are in the same day
	const isYesterday = dateDay.isSame(moment(today).subtract(1, 'day'), 'day');
	// the date in exam is between today and 6 day before today
	const isBetweenTodayAndSixDaysBefore = dateDay.isBetween(dateSixDaysBefore, moment(today));

	if (isSameDay) {
		return 'Today';
	}
	if (isYesterday) {
		return 'Yesterday';
	}
	if (isBetweenTodayAndSixDaysBefore) {
		return dateDay.format('dddd');
	}
	return moment.tz(actualDate, timezone).format('MMMM D YYYY');
};
