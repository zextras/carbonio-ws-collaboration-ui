/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import useRouting, { PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';

type WaitingRoomProps = {
	meetingId: string;
};

const WaitingRoom = ({ meetingId }: WaitingRoomProps): ReactElement => {
	const [meetingName, setMeetingName] = useState<string>('');
	const { goToInfoPage } = useRouting();

	useEffect(() => {
		MeetingsApi.getScheduledMeetingName(meetingId)
			.then((name) => setMeetingName(name))
			.catch(() => goToInfoPage(PAGE_INFO_TYPE.ERROR_PAGE));
	}, [goToInfoPage, meetingId]);

	return <Container>Waiting room {meetingName}</Container>;
};

export default WaitingRoom;
