/* eslint-disable prefer-template */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useState } from 'react';

import { dateToTimestamp } from '../utils/dateUtils';

const useTimer = (date: string | number | Date | undefined): string => {
	const difference = Date.now() - dateToTimestamp(date ?? Date.now());
	const [timespan, setTimespan] = useState(() => (difference > 0 ? difference : 0));

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (date) {
			interval = setInterval(() => {
				setTimespan(Date.now() - dateToTimestamp(date));
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [date]);

	const hours = Math.floor(timespan / (1000 * 60 * 60))
		.toString()
		.padStart(2, '0');

	const minutes = Math.floor((timespan / (1000 * 60)) % 60)
		.toString()
		.padStart(2, '0');

	const seconds = Math.floor((timespan / 1000) % 60)
		.toString()
		.padStart(2, '0');

	return `${hours !== '00' ? hours + ':' : ''}${minutes}:${seconds}`;
};

export default useTimer;
