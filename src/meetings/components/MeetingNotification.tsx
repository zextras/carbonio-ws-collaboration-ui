/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Avatar,
	Button,
	Container,
	IconButton,
	Input,
	Text
} from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { UsersApi } from '../../network';
import { getXmppClient } from '../../store/selectors/ConnectionSelector';
import { getUserName } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { MeetingCreatedEvent } from '../../types/network/websocket/wsMeetingEvents';
import meetingNotificationRingMp3 from '../assets/meeting-notification-sound.mp3';
import meetingNotificationRingOgg from '../assets/meeting-notification-sound.ogg';

type MeetingNotificationProps = {
	event: MeetingCreatedEvent;
	removeNotification: (notificationId: string) => void;
};

const NotificationContainer = styled(Container)`
	box-shadow: 0px 0px 4px rgba(166, 166, 166, 0.5);
	border-radius: 4px;
	max-width: 20rem;
`;

const CustomText = styled(Text)`
	text-align: center;
`;
const MeetingNotification = ({
	event,
	removeNotification
}: MeetingNotificationProps): ReactElement => {
	const xmppClient = useStore(getXmppClient);
	const userName: string = useStore((store) => getUserName(store, event.from)) || '';
	const meeting = useStore((store) => store.meetings[event.roomId]);

	const [t] = useTranslation();
	const userIsInvitingYouLabel = (
		<Trans
			i18nKey="meeting.newMeetingNotification.userIsInvitingYou"
			defaults="<strong>{{userName}}</strong> is inviting you"
			values={{ name: userName }}
		/>
	);
	const sendAQuickMessageLabel = t(
		'meeting.newMeetingNotification.sendAQuickMessage',
		'Send a quick message'
	);
	const declineLabel = t('action.decline', 'Decline');
	const joinMeetingLabel = t('action.joinMeeting', 'Join meeting');

	const [message, setMessage] = useState('');
	const [meetingSound, setMeetingSound] = useState(true);

	useEffect(() => {
		const soundTimeout = setTimeout(() => setMeetingSound(false), 10000);
		return () => clearTimeout(soundTimeout);
	}, []);

	// Remove notification if meeting is deleted from store
	useEffect(() => {
		if (!meeting) {
			removeNotification(event.id);
		}
	}, [event.id, meeting, removeNotification]);

	const onTextChange = useCallback((e) => setMessage(e.currentTarget.value.trim()), []);

	const sendMessage = useCallback(() => {
		xmppClient.sendChatMessage(event.roomId, message);
		setMessage('');
	}, [event.roomId, message, xmppClient]);

	const disableSendMessage = useMemo(() => size(message) === 0, [message]);

	const declineMeeting = useCallback(
		() => removeNotification(event.id),
		[event.id, removeNotification]
	);

	const joinMeeting = useCallback(() => {
		window.open(`external/${event.roomId}`);
		removeNotification(event.id);
	}, [event, removeNotification]);

	const picture = useMemo(() => UsersApi.getURLUserPicture(event.from), [event.from]);

	return (
		<NotificationContainer width="fill" height="fill" background="gray6" padding="1rem" gap="1rem">
			<Container>
				<Avatar size="large" label={userName} title={userName} picture={picture} />
				<CustomText overflow="break-word">{userIsInvitingYouLabel}</CustomText>
			</Container>
			<Container orientation="horizontal" gap="0.5rem">
				<Input
					value={message}
					label={sendAQuickMessageLabel}
					onEnter={sendMessage}
					onChange={onTextChange}
				/>
				<IconButton
					icon="Navigation2"
					size="extralarge"
					iconColor="primary"
					type="outlined"
					disabled={disableSendMessage}
					onClick={sendMessage}
				/>
			</Container>
			<Container orientation="horizontal" gap="0.5rem">
				<Button label={declineLabel} color="secondary" onClick={declineMeeting} />
				<Button label={joinMeetingLabel} onClick={joinMeeting} />
			</Container>
			{meetingSound && (
				// eslint-disable-next-line jsx-a11y/media-has-caption
				<audio autoPlay loop>
					<source id="src_mp3" type="audio/mp3" src={meetingNotificationRingMp3} />
					<source id="src_ogg" type="audio/ogg" src={meetingNotificationRingOgg} />
				</audio>
			)}
		</NotificationContainer>
	);
};

export default MeetingNotification;
