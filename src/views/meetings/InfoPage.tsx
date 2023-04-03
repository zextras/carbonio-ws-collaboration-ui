/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { useParams } from 'react-router-dom';

import useRouting from '../../hooks/useRouting';

const InfoPage = (): any => {
	const { goToMeetingPage } = useRouting();
	const { infoType }: any = useParams();
	console.log(infoType);
	setTimeout(() => goToMeetingPage('meetingId'), 5000);
	return <div>info page</div>;
};

export default InfoPage;
