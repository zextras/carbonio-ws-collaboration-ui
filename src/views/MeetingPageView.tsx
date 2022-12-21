/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';

import useRouting from '../hooks/useRouting';

const MeetingPageView = (): ReactElement => {
	const { goToWaitingPage } = useRouting();
	const { meetingId }: any = useParams();
	console.log(meetingId);
	setTimeout(() => goToWaitingPage('roomId', 'roomName'), 5000);
	return <div>meeting page</div>;
};

export default MeetingPageView;
