/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import moment from 'moment-timezone';

/**
 * Utility functions for date manipulation.
 * Accepted date formats:
 * - Date (native JS Date object)
 * - ISO Date ("YYYY-MM-DDTHH:mm:ss.sssZ")
 * - Unix timestamp (milliseconds)
 */

type DateType = Date | string | number;

export const setDateDefault = (
	timezoneId: string | undefined,
	locale: string | undefined
): void => {
	moment.tz.setDefault(timezoneId || moment.tz.guess());
	moment.locale(locale || 'en');
};

export const formatDate = (date: DateType, format: string): string => moment(date).format(format);

export const getCalendarTime = (date: DateType): string => moment(date).calendar().toLowerCase();

export const now = (): number => moment().valueOf();

// Transform generic date format into Unix timestamp (milliseconds)
export const dateToTimestamp = (date: DateType): number => moment(date).valueOf();

// Transform generic date format into ISO Date (format accept from XMPP)
export const dateToISODate = (date: DateType): string =>
	formatDate(date, 'YYYY-MM-DDTHH:mm:ss.SSSZ');

export const isBefore = (previousDate: DateType, nextDate: DateType): boolean =>
	moment(previousDate).isSameOrBefore(nextDate);

export const isStrictlyBefore = (previousDate: DateType, nextDate: DateType): boolean =>
	moment(previousDate).isBefore(nextDate);

export const datesAreFromTheSameDay = (date1: DateType, date2: DateType): boolean =>
	formatDate(date1, 'YYYY-MM-DD') === formatDate(date2, 'YYYY-MM-DD');

// it transforms a ms date to a string one
export const dateString = (actualDate: DateType): string => {
	// date of today
	const today = moment();
	// date in exam
	const dateDay = moment(actualDate);
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
	return moment(actualDate).format('MMMM D YYYY');
};
