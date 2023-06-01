/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Button, Container, Portal } from '@zextras/carbonio-design-system';
import { useCurrentRoute } from '@zextras/carbonio-shell-ui';
import { find, map, remove, size } from 'lodash';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MeetingNotification from './MeetingNotification';
import useEventListener, { EventName } from '../../hooks/useEventListener';
import { MeetingCreatedEvent } from '../../types/network/websocket/wsMeetingEvents';
import meetingNotificationRingMp3 from '../assets/meeting-notification-sound.mp3';
import meetingNotificationRingOgg from '../assets/meeting-notification-sound.ogg';

const PortalContainer = styled(Container)`
	position: fixed;
	z-index: 9999;
	top: 0;
	right: 0;
	max-height: calc(100vh - 1rem);
`;

const CustomContainer = styled(Container)`
	justify-content: start;
	overflow-y: scroll;
	/* Hide scrollbar for Chrome, Safari and Opera */
	&::-webkit-scrollbar {
		display: none;
	}
	-ms-overflow-style: none; /* IE and Edge */
	scrollbar-width: none; /* Firefox */
`;

const MeetingNotificationsHandler = (): ReactElement => {
	const [t] = useTranslation();
	const declineAllLabel = t('action.declineAll', 'Decline all');
	const currentRoute = useCurrentRoute();

	const [notificationArray, setNotificationArray] = useState<MeetingCreatedEvent[]>([]);
	const [meetingSound, setMeetingSound] = useState(true);

	const addNotification = useCallback(({ detail: meetingCreatedEvent }) => {
		setNotificationArray((prev) => [meetingCreatedEvent, ...prev]);
		setMeetingSound(true);
		setTimeout(() => setMeetingSound(false), 12000);
	}, []);

	const removeNotification = useCallback((notificationId: string): void => {
		setNotificationArray((prev: MeetingCreatedEvent[]) => {
			const notificationArray = [...prev];
			remove(notificationArray, (notification) => notification.id === notificationId);
			return notificationArray;
		});
		setMeetingSound(false);
	}, []);

	const removeNotificationFromMeetingEvent = useCallback(
		({ detail: meetingEvent }) => {
			const notificationToRemove = find(
				notificationArray,
				(notification) => notification.meetingId === meetingEvent.meetingId
			);
			if (notificationToRemove) {
				removeNotification(notificationToRemove.id);
				setMeetingSound(false);
			}
		},
		[notificationArray, removeNotification]
	);

	useEventListener(EventName.INCOMING_MEETING, addNotification);

	useEventListener(EventName.REMOVED_MEETING_NOTIFICATION, removeNotificationFromMeetingEvent);

	const notificationComponents = useMemo(
		() =>
			map(notificationArray, (notification) => (
				<MeetingNotification
					key={notification.id}
					id={notification.id}
					from={notification.from}
					roomId={notification.roomId}
					removeNotification={removeNotification}
					stopMeetingSound={(): void => setMeetingSound(false)}
				/>
			)),
		[notificationArray, removeNotification]
	);

	const declineAll = useCallback(() => {
		setNotificationArray([]);
		setMeetingSound(false);
	}, []);

	const displayPortal = useMemo(
		() => size(notificationArray) > 0 && currentRoute?.route !== 'external',
		[notificationArray, currentRoute]
	);

	return (
		<Portal show={displayPortal}>
			<PortalContainer
				width="fit"
				height="fit"
				padding={{ top: '4.75rem', right: '1rem' }}
				gap="1rem"
				data-testid="incoming_call_notification_portal"
			>
				{size(notificationArray) > 1 && (
					<Button color="secondary" label={declineAllLabel} onClick={declineAll} width="fill" />
				)}
				<CustomContainer width="fit" height="fit" gap="1rem" padding={{ all: '0.25rem' }}>
					{notificationComponents}
				</CustomContainer>
				{meetingSound && size(notificationArray) > 0 && (
					// eslint-disable-next-line jsx-a11y/media-has-caption
					<audio autoPlay loop>
						<source id="src_mp3" type="audio/mp3" src={meetingNotificationRingMp3} />
						<source id="src_ogg" type="audio/ogg" src={meetingNotificationRingOgg} />
					</audio>
				)}
			</PortalContainer>
		</Portal>
	);
};

export default MeetingNotificationsHandler;
