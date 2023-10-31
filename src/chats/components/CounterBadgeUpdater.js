/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { updatePrimaryBadge } from '@zextras/carbonio-shell-ui';

import { CHATS_ROUTE } from '../../constants/appConstants';
import { getTotalUnreadCountSelector } from '../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../store/Store';

const CounterBadgeUpdater = () => {
	const totalUnreadCount = useStore(getTotalUnreadCountSelector);

	useEffect(() => {
		updatePrimaryBadge(
			{
				show: totalUnreadCount > 0,
				count: totalUnreadCount,
				showCount: true
			},
			CHATS_ROUTE
		);
	}, [totalUnreadCount]);

	return null;
};

export default CounterBadgeUpdater;
