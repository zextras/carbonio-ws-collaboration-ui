/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Button, Container, Portal } from '@zextras/carbonio-design-system';
import { map, remove, size } from 'lodash';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MeetingNotification from './MeetingNotification';
import useEventListener, { EventName } from '../../hooks/useEventListener';
import { MeetingCreatedEvent } from '../../types/network/websocket/wsMeetingEvents';

const PortalContainer = styled(Container)`
	position: fixed;
	z-index: 9999;
	top: 0;
	right: 0;
`;

const MeetingNotificationsHandler = (): ReactElement => {
	const [t] = useTranslation();
	const declineAllLabel = t('action.declineAll', 'Decline all');

	const [notificationArray, setNotificationArray] = useState<MeetingCreatedEvent[]>([]);

	const addNotification = useCallback(
		({ detail: meetingCreatedEvent }) =>
			setNotificationArray((prev) => [...prev, meetingCreatedEvent]),
		[]
	);

	const removeNotification = useCallback(
		(notificationId: string): void =>
			setNotificationArray((prev: MeetingCreatedEvent[]) => {
				const notificationArray = [...prev];
				remove(notificationArray, (notification) => notification.id === notificationId);
				return notificationArray;
			}),
		[]
	);

	useEventListener(EventName.INCOMING_MEETING, addNotification);

	const notificationComponents = useMemo(
		() =>
			map(notificationArray, (notification) => (
				<MeetingNotification event={notification} removeNotification={removeNotification} />
			)),
		[notificationArray, removeNotification]
	);

	const declineAll = useCallback(() => setNotificationArray([]), []);

	const displayPortal = useMemo(() => size(notificationArray) > 0, [notificationArray]);

	return (
		<Portal show={displayPortal}>
			<PortalContainer
				width="fit"
				height="fit"
				padding={{ top: '4.75rem', right: '1rem' }}
				gap="1rem"
			>
				{size(notificationArray) > 1 && (
					<Button color="secondary" label={declineAllLabel} onClick={declineAll} width="fill" />
				)}
				{notificationComponents}
			</PortalContainer>
		</Portal>
	);
};

export default MeetingNotificationsHandler;
