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
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { UsersApi } from '../../network';
import { getXmppClient } from '../../store/selectors/ConnectionSelector';
import { getUserName, getUserPictureUpdatedAt } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import meetingNotificationRingMp3 from '../assets/meeting-notification-sound.mp3';
import meetingNotificationRingOgg from '../assets/meeting-notification-sound.ogg';

const NotificationContainer = styled(Container)`
	box-shadow: 0px 0px 4px rgba(166, 166, 166, 0.5);
	border-radius: 4px;
	min-width: 20rem;
	max-width: 25rem;
`;

const CustomText = styled(Text)`
	text-align: center;
`;

const CustomTooltip = styled(Tooltip)`
	z-index: 99999;
`;

type MeetingNotificationProps = {
	id: string;
	from: string;
	roomId: string;
	removeNotification: (notificationId: string) => void;
};
const MeetingNotification = ({
	id,
	from,
	roomId,
	removeNotification
}: MeetingNotificationProps): ReactElement => {
	const xmppClient = useStore(getXmppClient);
	const userName: string = useStore((store) => getUserName(store, from)) || '';
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, from)
	);
	const meeting = useStore((store) => store.meetings[roomId]);

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
	const disableSendTooltip = t(
		'meeting.newMeetingNotification.writeAMessageToSendIt',
		'Write a message to send it'
	);
	const activeSendTooltip = t('meeting.newMeetingNotification.sendMessage', 'Send message');

	const [message, setMessage] = useState('');
	const [meetingSound, setMeetingSound] = useState(true);

	useEffect(() => {
		const soundTimeout = setTimeout(() => setMeetingSound(false), 10000);
		return () => clearTimeout(soundTimeout);
	}, []);

	// Remove notification if meeting is deleted from store
	useEffect(() => {
		if (!meeting) {
			removeNotification(id);
		}
	}, [id, meeting, removeNotification]);

	const onTextChange = useCallback((e) => setMessage(e.currentTarget.value.trim()), []);

	const disableSendMessage = useMemo(() => size(message) === 0, [message]);

	const sendMessage = useCallback(() => {
		if (!disableSendMessage) {
			xmppClient.sendChatMessage(roomId, message);
			setMessage('');
		}
	}, [disableSendMessage, roomId, message, xmppClient]);

	const declineMeeting = useCallback(() => removeNotification(id), [id, removeNotification]);

	const joinMeeting = useCallback(() => {
		window.open(`external/${roomId}`);
		removeNotification(id);
	}, [id, removeNotification, roomId]);

	const picture = useMemo(() => UsersApi.getURLUserPicture(from), [from]);

	return (
		<NotificationContainer
			data-testid="incoming_call_notification"
			width="fill"
			height="fill"
			background="gray6"
			padding="1rem"
			gap="1rem"
		>
			<Container gap="0.5rem">
				<Avatar
					size="large"
					label={userName}
					title={userName}
					picture={userPictureUpdatedAt ? picture : false}
				/>
				<CustomText overflow="break-word">{userIsInvitingYouLabel}</CustomText>
			</Container>
			<Container orientation="horizontal" gap="0.5rem">
				<Input
					value={message}
					label={sendAQuickMessageLabel}
					onEnter={sendMessage}
					onChange={onTextChange}
				/>
				<CustomTooltip label={disableSendMessage ? disableSendTooltip : activeSendTooltip}>
					<IconButton
						icon="Navigation2"
						size="extralarge"
						iconColor="primary"
						type="outlined"
						disabled={disableSendMessage}
						onClick={sendMessage}
					/>
				</CustomTooltip>
			</Container>
			<Container orientation="horizontal" gap="0.5rem">
				<Button width="fill" label={declineLabel} color="secondary" onClick={declineMeeting} />
				<Button width="fill" label={joinMeetingLabel} onClick={joinMeeting} />
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
