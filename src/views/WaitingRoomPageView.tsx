/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';

import useRouting, { PAGE_INFO_TYPE } from '../hooks/useRouting';

const WaitingRoomPageView = (): ReactElement => {
	const { goToInfoPage } = useRouting();
	const param = useParams();
	console.log(param);
	setTimeout(() => goToInfoPage(PAGE_INFO_TYPE.ERROR_PAGE), 5000);
	return <div>waiting page</div>;
};

export default WaitingRoomPageView;
