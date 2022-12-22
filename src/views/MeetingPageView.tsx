/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Button, Container, Padding } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import useRouting, { PAGE_INFO_TYPE } from '../hooks/useRouting';
import { MeetingsApi } from '../network';

const MeetingPageView = (): ReactElement => {
	const { goToInfoPage } = useRouting();
	const { meetingId }: any = useParams();

	const leaveMeeting = useCallback(() => {
		MeetingsApi.leaveMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [meetingId, goToInfoPage]);

	const deleteMeeting = useCallback(() => {
		MeetingsApi.deleteMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [meetingId, goToInfoPage]);

	return (
		<Container>
			<Button label="Leave meeting" onClick={leaveMeeting} color="error" size="large" />
			<Padding />
			<Button label="Delete meeting" onClick={deleteMeeting} color="error" size="large" />
		</Container>
	);
};

export default MeetingPageView;
