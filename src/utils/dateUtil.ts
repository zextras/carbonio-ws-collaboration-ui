/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import moment from 'moment-timezone';

export const setDateDefault = (timezoneId: string, locale: string): void => {
	moment.tz.setDefault(timezoneId);
	moment.locale(locale);
};

export const now = (): number => moment().valueOf();

// Transform generic date format into Unix timestamp (milliseconds)
export const dateToTimestamp = (date: Date | string | number): number => moment(date).valueOf();

// Transform generic date format into ISO Date (format accept from XMPP)
export const dateToISODate = (date: Date | number | string): string =>
	moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSZ');

export const displayTimestamp = (timestamp: Date | string | number): string =>
	moment(timestamp).format('HH:mm:ss DD-MM-YYYY');

export const isBefore = (previousDate: number | string, nextDate: number | string): boolean =>
	moment(previousDate).isSameOrBefore(nextDate);

export const isStrictlyBefore = (
	previousDate: number | string,
	nextDate: number | string
): boolean => moment(previousDate).isBefore(nextDate);

// It returns true if the two dates represent the same day
export const datesAreFromTheSameDay = (
	date1: Date | number | string,
	date2: Date | number | string
): boolean => moment(date1).format('YYYY-MM-DD') === moment(date2).format('YYYY-MM-DD');

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
