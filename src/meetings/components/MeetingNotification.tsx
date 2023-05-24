/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';

import { MeetingCreatedEvent } from '../../types/network/websocket/wsMeetingEvents';

type MeetingNotificationProps = {
	event: MeetingCreatedEvent;
};
const MeetingNotification = ({ event }: MeetingNotificationProps): ReactElement => (
	<Container> {event.id}</Container>
);

export default MeetingNotification;
