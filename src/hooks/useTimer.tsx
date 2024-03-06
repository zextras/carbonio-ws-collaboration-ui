/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useState } from 'react';

import { dateToTimestamp } from '../utils/dateUtils';

type UseTimerReturn = {
	hours: string;
	minutes: string;
	seconds: string;
};

const useTimer = (date: string | number | Date): UseTimerReturn => {
	const [timespan, setTimespan] = useState(Date.now() - dateToTimestamp(date));

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (date) {
			interval = setInterval(() => {
				setTimespan(Date.now() - dateToTimestamp(date));
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [date]);

	const hours = Math.floor(timespan / (1000 * 60 * 60));

	const minutes = Math.floor((timespan / (1000 * 60)) % 60);

	const seconds = Math.floor((timespan / 1000) % 60);

	return {
		hours: hours.toString().padStart(2, '0'),
		minutes: minutes.toString().padStart(2, '0'),
		seconds: seconds.toString().padStart(2, '0')
	};
};

export default useTimer;
