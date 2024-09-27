/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useMemo } from 'react';

import { Button, Container, Icon, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useEventListener, { EventName } from '../../../hooks/useEventListener';
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

	const { hasUserDirectAccess, ShowMeetingAccessPage, accessTitle, userIsReady, setUserIsReady } =
		useAccessMeetingInformation();

	const { handleEnterMeeting, handleWaitingRoom } = useAccessMeetingAction(
		hasUserDirectAccess,
		null, // TODO
		userIsReady,
		setUserIsReady
	);

	const waitingRoomLabels = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
		return (
			!hasUserDirectAccess && (
				<Container height="fit">
					<Text>{userIsReady ? areYouReadyLabel : whenYouAreReadyLabel}</Text>
					<Text>{aModeratorWillLetYouEnterLabel}</Text>
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

	const enterButton = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
		if (hasUserDirectAccess)
			return (
				<Button
					data-testid="enterMeetingButton"
					width="fill"
					label={enter}
					onClick={() => handleEnterMeeting()}
					// disabled={!enterButtonIsEnabled} // TODO
				/>
			);
		if (!userIsReady)
			return (
				<Button
					backgroundColor="success"
					label={readyToParticipateLabel}
					icon="CheckmarkOutline"
					iconPlacement="right"
					onClick={() => handleWaitingRoom()}
					width="fill"
					// disabled={!enterButtonIsEnabled} // TODO
				/>
			);
		return (
			<Container orientation="horizontal" gap="0.5rem" mainAlignment="flex-start">
				<Icon icon="CheckmarkCircle2" color="success" size="large" />
				<Text weight="bold" size="extralarge">
					{readyLabel}
				</Text>
			</Container>
		);
	}, [
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
			<>
				<Text>{accessTitle}</Text>
				{waitingRoomLabels}
				<Container>
					<Button onClick={(): void => {}} icon="Mic" />
					{enterButton}
				</Container>
			</>
		</ShowMeetingAccessPage>
	);
};

export default MeetingAccessMobilePage;
