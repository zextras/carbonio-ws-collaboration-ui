/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import MeetingNotification from './MeetingNotification';
import useEventListener, { EventName } from '../../hooks/useEventListener';
import { MeetingCreatedEvent } from '../../types/network/websocket/wsMeetingEvents';

const MeetingNotificationsHandler = (): ReactElement => {
	const [notificationArray, setNotificationArray] = useState<MeetingCreatedEvent[]>([]);

	const addIncomingMeeting = useCallback(({ detail: meetingCreatedEvent }) => {
		setNotificationArray((prev) => [...prev, meetingCreatedEvent]);
	}, []);

	useEventListener(EventName.INCOMING_MEETING, addIncomingMeeting);

	const notificationComponents = useMemo(
		() => map(notificationArray, (notification) => <MeetingNotification event={notification} />),
		[notificationArray]
	);

	return <Container> {notificationComponents} </Container>;
};

export default MeetingNotificationsHandler;
