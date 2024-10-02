/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { Button, Container, Icon, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useEventListener, { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import Logo from '../../components/Logo';
import useAccessMeetingAction from '../../components/meetingAccessPoint/useAccessMeetingAction';
import useAccessMeetingInformation from '../../components/meetingAccessPoint/useAccessMeetingInformation';

const MeetingAccessMobilePage = (): ReactElement => {
	const [t] = useTranslation();

	const readyToParticipateLabel = t('meeting.waitingRoom.ready', 'Ready to participate');
	const areYouReadyLabel = t(
		'meeting.waitingRoom.readyCaption',
		'Everything is set! Make yourself comfortable.'
	);
	const whenYouAreReadyLabel = t(
		'meeting.waitingRoom.welcomeCaption',
		'When you are ready, get comfortable.'
	);
	const aModeratorWillLetYouEnterLabel = t(
		'meeting.waitingRoom.nextStep',
		'A moderator will let you into the meeting as soon as possible.'
	);
	const enter = t('action.enter', 'Enter');
	const readyLabel = t('meeting.waitingRoom.userIsReady', "You're ready!");

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const [audioOn, setAudioOn] = useState(false);

	const toggleAudio = useCallback(() => setAudioOn((prev) => !prev), []);

	const { hasUserDirectAccess, ShowMeetingAccessPage, accessTitle, userIsReady, setUserIsReady } =
		useAccessMeetingInformation();

	const { handleEnterMeeting, handleWaitingRoom } = useAccessMeetingAction(
		hasUserDirectAccess,
		null,
		userIsReady,
		setUserIsReady
	);

	const waitingRoomLabels = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
		return (
			!hasUserDirectAccess && (
				<Container height="fit">
					<Text overflow="break-word" textAlign="center">
						{userIsReady ? areYouReadyLabel : whenYouAreReadyLabel}
					</Text>
					<Text overflow="break-word" textAlign="center">
						{aModeratorWillLetYouEnterLabel}
					</Text>
				</Container>
			)
		);
	}, [
		aModeratorWillLetYouEnterLabel,
		areYouReadyLabel,
		hasUserDirectAccess,
		userIsReady,
		whenYouAreReadyLabel
	]);

	const areNetworksUp = useMemo(() => {
		if (chatsBeNetworkStatus !== undefined && websocketNetworkStatus !== undefined) {
			return chatsBeNetworkStatus && websocketNetworkStatus;
		}
		return false;
	}, [chatsBeNetworkStatus, websocketNetworkStatus]);

	const enterButton = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
		if (hasUserDirectAccess)
			return (
				<Button
					data-testid="enterMeetingButton"
					width="fill"
					label={enter}
					onClick={() => handleEnterMeeting({ audio: audioOn, video: false })}
					disabled={!areNetworksUp}
				/>
			);
		if (!userIsReady)
			return (
				<Button
					backgroundColor="success"
					label={readyToParticipateLabel}
					icon="CheckmarkOutline"
					iconPlacement="right"
					onClick={() => handleWaitingRoom({ audio: audioOn, video: false })}
					width="fill"
					disabled={!areNetworksUp}
				/>
			);
		return (
			<Container orientation="horizontal" gap="0.5rem" mainAlignment="center">
				<Icon icon="CheckmarkCircle2" color="success" size="large" />
				<Text weight="bold" size="extralarge">
					{readyLabel}
				</Text>
			</Container>
		);
	}, [
		areNetworksUp,
		audioOn,
		enter,
		handleEnterMeeting,
		handleWaitingRoom,
		hasUserDirectAccess,
		readyLabel,
		readyToParticipateLabel,
		userIsReady
	]);

	useEventListener(EventName.MEETING_USER_ACCEPTED, () => handleWaitingRoom());

	return (
		<ShowMeetingAccessPage>
			<Logo top="1.5rem" left="1.5rem" />
			<Container gap="1rem">
				<Text weight="bold" overflow="break-word" textAlign="center">
					{accessTitle}
				</Text>
				{waitingRoomLabels}
			</Container>
			<Container height="fit" orientation="horizontal" gap="2rem" padding="1rem">
				<Button
					onClick={toggleAudio}
					icon={audioOn ? 'Mic' : 'MicOff'}
					size="large"
					color="text"
					minWidth="2.5rem"
				/>
				{enterButton}
			</Container>
		</ShowMeetingAccessPage>
	);
};

export default MeetingAccessMobilePage;
