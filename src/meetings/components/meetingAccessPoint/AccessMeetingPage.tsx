/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, Button, Tooltip, IconButton, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import AccessMeetingPageMediaSection from './AccessMeetingPageMediaSection';
import { MEETINGS_PATH } from '../../../constants/appConstants';
import useEventListener, { EventName } from '../../../hooks/useEventListener';
import useRouting, { PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { getRoomIdFromMeeting } from '../../../store/selectors/MeetingSelectors';
import { getRoomNameSelector, getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';
import { freeMediaResources } from '../../../utils/MeetingsUtils';
import { calcScaleDivisor } from '../../../utils/styleUtils';

type AccessMeetingPageProps = {
	hasUserDirectAccess: boolean | undefined;
	meetingName: string;
};

const CustomContainer = styled(Container)`
	position: absolute;
	left: 4rem;
	bottom: 3rem;
`;

const AccessMeetingPage: FC<AccessMeetingPageProps> = ({ hasUserDirectAccess, meetingName }) => {
	const [t] = useTranslation();
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);
	const roomId = useStore((store) => getRoomIdFromMeeting(store, meetingId) ?? ``);
	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));

	const leave = t('action.leave', 'Leave');
	const leaveMeetingLabel = t('meeting.interactions.leaveMeeting', 'Leave Meeting');
	const groupTitle = t(
		'meeting.startModal.enterRoomMeetingTitle',
		`Participate to ${conversationTitle} meeting`,
		{ meetingTitle: conversationTitle }
	);
	const oneToOneTitle = t(
		'meeting.startModal.enterOneToOneMeetingTitle',
		`Start meeting with ${conversationTitle}`,
		{ meetingTitle: conversationTitle }
	);
	const clickOnReadyLabel = t(
		'meeting.waitingRoom.welcomeHint',
		'Click on “READY TO PARTICIPATE” to enter the meeting'
	);
	const enterInAFewMomentsLabel = t(
		'meeting.waitingRoom.readyHint',
		'You will enter the meeting in a few moments'
	);

	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));

	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [pageWidth, setPageWidth] = useState(window.innerWidth);
	const [wrapperWidth, setWrapperWidth] = useState<number>((window.innerWidth * 0.33) / 16);
	const [userIsReady, setUserIsReady] = useState<boolean>(false);

	const { goToInfoPage } = useRouting();

	const accessTitle = useMemo(() => {
		const roomTypeTitle = roomType === RoomType.ONE_TO_ONE ? oneToOneTitle : groupTitle;
		if (hasUserDirectAccess === undefined) return '';
		if (hasUserDirectAccess) return roomTypeTitle;
		return userIsReady ? enterInAFewMomentsLabel : clickOnReadyLabel;
	}, [
		roomType,
		oneToOneTitle,
		groupTitle,
		hasUserDirectAccess,
		userIsReady,
		enterInAFewMomentsLabel,
		clickOnReadyLabel
	]);

	// resize handling
	const handleResize = useCallback(() => {
		setPageWidth(window.innerWidth);
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

	const handleRejected = useCallback(() => {
		freeMediaResources(streamTrack);
		goToInfoPage(PAGE_INFO_TYPE.NEXT_TIME_PAGE);
	}, [goToInfoPage, streamTrack]);

	const handleRejoin = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
	}, [goToInfoPage]);

	const handleMeetingEnded = useCallback(() => {
		if (!hasUserDirectAccess) {
			goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
		}
	}, [goToInfoPage, hasUserDirectAccess]);

	const handleLeave = useCallback(() => {
		freeMediaResources(streamTrack);
		if (userIsReady) MeetingsApi.leaveWaitingRoom(meetingId);
		goToInfoPage(PAGE_INFO_TYPE.HANG_UP_PAGE);
	}, [goToInfoPage, meetingId, streamTrack, userIsReady]);

	useEventListener(EventName.MEETING_USER_REJECTED, handleRejected);
	useEventListener(EventName.MEETING_WAITING_PARTICIPANT_CLASHED, handleRejoin);
	useEventListener(EventName.MEETING_STOPPED, handleMeetingEnded);

	// Leave waiting list on window close
	useEffect(() => {
		window.parent.addEventListener('beforeunload', handleLeave);
		return () => {
			window.parent.removeEventListener('beforeunload', handleLeave);
		};
	}, [handleLeave]);

	useEffect(() => {
		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, [handleResize]);

	useEffect(() => {
		setPageWidth(window.innerWidth);
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

	const leaveButton = useMemo(() => {
		if (hasUserDirectAccess === undefined) {
			return undefined;
		}
		return (
			!hasUserDirectAccess && (
				<CustomContainer
					height="fit"
					width="fit"
					mainAlignment="flex-end"
					crossAlignment="flex-start"
				>
					{pageWidth >= 1024 ? (
						<Button
							backgroundColor="error"
							label={leave}
							icon="LogOut"
							iconPlacement="right"
							onClick={handleLeave}
						/>
					) : (
						<Tooltip label={leaveMeetingLabel}>
							<IconButton
								size="large"
								backgroundColor="error"
								icon="LogOut"
								onClick={handleLeave}
							/>
						</Tooltip>
					)}
				</CustomContainer>
			)
		);
	}, [handleLeave, hasUserDirectAccess, leave, leaveMeetingLabel, pageWidth]);

	return (
		<Container>
			<Container mainAlignment="center" crossAlignment="center" gap="1.5rem">
				<Text size="extralarge" weight="bold">
					{accessTitle}
				</Text>
				<AccessMeetingPageMediaSection
					streamTrack={streamTrack}
					setStreamTrack={setStreamTrack}
					hasUserDirectAccess={hasUserDirectAccess}
					userIsReady={userIsReady}
					setUserIsReady={setUserIsReady}
					meetingName={meetingName}
					wrapperWidth={wrapperWidth}
				/>
			</Container>
			{leaveButton}
		</Container>
	);
};

export default AccessMeetingPage;
