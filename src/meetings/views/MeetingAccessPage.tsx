/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Text, Tooltip } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MEETINGS_PATH } from '../../constants/appConstants';
import useDarkReader from '../../hooks/useDarkReader';
import useRouting from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import { getRoomIdByMeetingId } from '../../store/selectors/MeetingSelectors';
import { getRoomNameSelector, getRoomTypeSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { calcScaleDivisor } from '../../utils/styleUtils';
import { MediaStatus } from '../components/meetingAccessPoint/externalAccess/MeetingExternalAccessPage';
import MeetingAccessPageMediaSection from '../components/meetingAccessPoint/MeetingAccessPageMediaSection';
import useAccessMeeting from '../components/meetingAccessPoint/useAccessMeeting';
import { PAGE_INFO_TYPE } from '../contexts/routerContext';

const CustomContainer = styled(Container)`
	position: absolute;
	left: 4rem;
	bottom: 3rem;
`;

const CustomTextContainer = styled(Container)`
	text-align: center;
`;

const MeetingAccessPage = (): ReactElement => {
	const meetingId = useMemo(() => window.location.pathname.split(MEETINGS_PATH)[1], []);

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId) ?? ``);
	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));

	const [t] = useTranslation();
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

	const [meetingName, setMeetingName] = useState<string>('');
	const [hasUserDirectAccess, setHasUserDirectAccess] = useState<boolean | undefined>(undefined);
	const [pageWidth, setPageWidth] = useState(window.innerWidth);
	const [wrapperWidth, setWrapperWidth] = useState<number>((window.innerWidth * 0.33) / 16);
	const [mediaStatus, setMediaStatus] = useState<MediaStatus>({
		audio: { enabled: false },
		video: { enabled: false }
	});

	const { handleLeave, handleEnterMeeting, handleWaitingRoom, userIsReady } =
		useAccessMeeting(mediaStatus);

	const { enableDarkReader } = useDarkReader();

	useEffect(() => {
		enableDarkReader();
	}, [enableDarkReader]);

	const { goToInfoPage } = useRouting();

	useEffect(() => {
		if (chatsBeNetworkStatus) {
			MeetingsApi.getMeetingByMeetingId(meetingId)
				.then((meeting) => {
					const room = find(useStore.getState().rooms, (room) => room.meetingId === meetingId);
					const iAmOwner = find(
						room?.members,
						(member) => member.userId === useStore.getState().session.id && member.owner
					);
					// Modal access for permanent meeting and scheduled owners
					if (meeting.meetingType === MeetingType.PERMANENT || iAmOwner) {
						setHasUserDirectAccess(true);
					} else {
						// Waiting room access for scheduled member
						setHasUserDirectAccess(false);
						setMeetingName(meeting.name);
					}
				})
				.catch(() => {
					// Waiting room access for external
					MeetingsApi.getScheduledMeetingName(meetingId)
						.then((resp) => {
							setHasUserDirectAccess(false);
							setMeetingName(resp.name);
						})
						.catch(() => {
							goToInfoPage(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
						});
				});
		}
	}, [chatsBeNetworkStatus, goToInfoPage, meetingId]);

	const handleResize = useCallback(() => {
		setPageWidth(window.innerWidth);
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

	useEffect(() => {
		window.addEventListener('resize', handleResize);
		return (): void => window.removeEventListener('resize', handleResize);
	}, [handleResize]);

	useEffect(() => {
		setPageWidth(window.innerWidth);
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

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

	const leaveButton = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
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
							<Button size="large" backgroundColor="error" icon="LogOut" onClick={handleLeave} />
						</Tooltip>
					)}
				</CustomContainer>
			)
		);
	}, [handleLeave, hasUserDirectAccess, leave, leaveMeetingLabel, pageWidth]);

	return (
		<Container
			background={'gray0'}
			padding={{ vertical: '4.5rem', horizontal: '1rem' }}
			data-testid="meeting_access_page_view"
		>
			{chatsBeNetworkStatus && hasUserDirectAccess !== undefined && (
				<Container maxWidth="45%">
					<Container mainAlignment="center" crossAlignment="center" gap="1.5rem">
						<CustomTextContainer height="fit" width="fit">
							<Text size="extralarge" weight="bold" overflow="break-word">
								{accessTitle}
							</Text>
						</CustomTextContainer>
						<MeetingAccessPageMediaSection
							hasUserDirectAccess={hasUserDirectAccess}
							userIsReady={userIsReady}
							meetingName={meetingName}
							wrapperWidth={wrapperWidth}
							handleEnterMeeting={handleEnterMeeting}
							handleWaitingRoom={handleWaitingRoom}
							setMediaStatus={setMediaStatus}
						/>
					</Container>
					{leaveButton}
				</Container>
			)}
		</Container>
	);
};

export default MeetingAccessPage;
