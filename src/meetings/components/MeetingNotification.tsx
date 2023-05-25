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
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { UsersApi } from '../../network';
import { getXmppClient } from '../../store/selectors/ConnectionSelector';
import { getUserName } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { MeetingCreatedEvent } from '../../types/network/websocket/wsMeetingEvents';

type MeetingNotificationProps = {
	event: MeetingCreatedEvent;
	removeNotification: (notificationId: string) => void;
};

const NotificationContainer = styled(Container)`
	box-shadow: 0px 0px 4px rgba(166, 166, 166, 0.5);
	border-radius: 4px;
`;
const MeetingNotification = ({
	event,
	removeNotification
}: MeetingNotificationProps): ReactElement => {
	const xmppClient = useStore(getXmppClient);
	const userName: string = useStore((store) => getUserName(store, event.from)) || '';

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
				<Text>{userIsInvitingYouLabel}</Text>
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
		</NotificationContainer>
	);
};

export default MeetingNotification;
