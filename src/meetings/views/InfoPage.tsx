/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Divider, Icon, Padding, Text } from '@zextras/carbonio-design-system';
import { useTracker } from '@zextras/carbonio-shell-ui';
import { map, range } from 'lodash';
import { useTranslation } from 'react-i18next';

import { CHATS_APP_ID, TRACKER_EVENT } from '../../constants/appConstants';
import useDarkReader from '../../hooks/useDarkReader';
import { getRoomIdByMeetingId } from '../../store/selectors/MeetingSelectors';
import { getRoomNameSelector } from '../../store/selectors/RoomsSelectors';
import { getIsLoggedUserExternal } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { BrowserUtils } from '../../utils/BrowserUtils';
import { PAGE_INFO_TYPE, RouterContext } from '../contexts/routerContext';

const Title = styled(Text)`
	font-size: 1.6rem;
`;

const Feedback = styled(Text)`
	font-size: 1.3rem;
	line-height: 1.75rem;
`;

const Slogan = styled(Text)`
	font-size: 1.375rem;
`;

const StarIcon = styled(Icon)`
	height: 1.75rem;
	width: 1.75rem;
	cursor: pointer;
`;

const InfoPage = (): ReactElement => {
	const { infoType, meetingId } = useContext(RouterContext);

	const { capture } = useTracker();

	const [t] = useTranslation();

	const meetingExperienceLabel = t(
		'meeting.infoPage.feedback.title',
		'Let us know what you think about your experience with this meeting.'
	);
	const thankYouLabel = t('meeting.infoPage.feedback.thankYou', 'THANKS FOR YOUR FEEDBACK!');
	const opinionLabel = t(
		'meeting.infoPage.feedback.description',
		'Your opinion is important to us!'
	);
	const improveLabel = t('meeting.infoPage.feedback.caption', 'It can allow us to improve :)');

	const [hoveredStarIndex, setHoveredStarIndex] = useState<number | null>(null);
	const [clicked, setClicked] = useState(false);

	const isLoggedUserExternal = useStore(getIsLoggedUserExternal);

	useEffect(() => {
		if (isLoggedUserExternal) {
			BrowserUtils.clearAuthCookies();
		}
	}, [isLoggedUserExternal]);

	useEffect(() => {
		const { activeMeeting, meetingDisconnection } = useStore.getState();
		if (activeMeeting) meetingDisconnection(activeMeeting.meetingId);
	}, []);

	const { titleLabel, sloganLabel, descriptionLabel } = useMemo(() => {
		switch (infoType) {
			case PAGE_INFO_TYPE.ROOM_EMPTY:
				return {
					titleLabel: t('external.roomIsEmpty', 'This Room is empty'),
					sloganLabel: t('tryLater', 'Try later'),
					descriptionLabel: t('external.nobodyInTheRoom', 'It seems nobody is in this Room')
				};
			case PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION:
				return {
					titleLabel: t(
						'meeting.openedInAnotherWindow',
						'This meeting is already open in another window'
					),
					sloganLabel: t('meeting.continueActiveSession', 'Continue the meeting in the new window'),
					descriptionLabel: t(
						'meeting.noMoreActiveSession',
						'There cannot be more than one active session of the same meeting'
					)
				};
			case PAGE_INFO_TYPE.HANG_UP_PAGE:
				return {
					titleLabel: t('meeting.infoPage.title.hangUp', 'You left the waiting room'),
					sloganLabel: t('meeting.infoPage.slogan.hangUp', 'Maybe next time'),
					descriptionLabel: t(
						'meeting.infoPage.description.hangUp',
						'We look forward to seeing you participate in future meetings'
					)
				};
			case PAGE_INFO_TYPE.NEXT_TIME_PAGE:
				return {
					titleLabel: t('meeting.infoPage.title.rejected', 'Your access has been refused'),
					sloganLabel: t('meeting.infoPage.slogan.rejected', 'Maybe next time'),
					descriptionLabel: t(
						'meeting.infoPage.description.rejected',
						'The moderators have decided to deny your access to the meeting'
					)
				};
			case PAGE_INFO_TYPE.MEETING_ENDED:
				return {
					titleLabel: t('notification.meeting.ended', 'Meeting Ended'),
					sloganLabel: t('thanksForParticipating', 'Thanks for participating'),
					descriptionLabel: t(
						'keepInTouchWithColleagues',
						"Keep in touch with your colleagues or join your groups' meeting rooms"
					)
				};
			case PAGE_INFO_TYPE.MEETING_DECLINED: {
				const roomId = getRoomIdByMeetingId(useStore.getState(), meetingId ?? '');
				const roomName = getRoomNameSelector(useStore.getState(), roomId ?? '');
				return {
					titleLabel: t('meeting.infoPage.title.meetingDeclined', 'Call Declined'),
					sloganLabel: t('meeting.infoPage.slogan.meetingDeclined', 'Call ended'),
					descriptionLabel: t(
						'meeting.infoPage.description.meetingDeclined',
						'{{userName}} declined the call',
						{ userName: roomName }
					)
				};
			}
			case PAGE_INFO_TYPE.UNAUTHENTICATED:
				return {
					titleLabel: t('meeting.infoPage.title.notAuthenticatedUser', 'You are not authenticated'),
					sloganLabel: t(
						'meeting.infoPage.slogan.notAuthenticatedUser',
						'login to access the meeting'
					),
					descriptionLabel: t(
						'meeting.infoPage.description.notAuthenticatedUser',
						'You cannot join the meeting if you are not authenticated with your account'
					)
				};
			case PAGE_INFO_TYPE.INVALID_WAITING_ROOM:
				return {
					titleLabel: t(
						'meeting.infoPage.title.invalidWaiting',
						'There are no moderators in the meeting'
					),
					sloganLabel: t('meeting.infoPage.slogan.invalidWaiting', 'Try again later'),
					descriptionLabel: t(
						'meeting.infoPage.description.invalidWaiting',
						'You must be approved by a moderator to join this meeting.'
					)
				};
			case PAGE_INFO_TYPE.GENERAL_ERROR:
				return {
					titleLabel: t('meeting.infoPage.title.generalError', 'Ouch! You left the meeting.'),
					sloganLabel: t('meeting.infoPage.slogan.generalError', 'PLEASE, TRY TO JOIN AGAIN'),
					descriptionLabel: t('meeting.infoPage.description.generalError', 'Something went wrong.')
				};
			case PAGE_INFO_TYPE.MEETING_NOT_FOUND:
			default: {
				return {
					titleLabel: t(
						'meeting.infoPage.title.meetingNotFound',
						'The meeting you are looking for does not exist'
					),
					sloganLabel: t('meeting.infoPage.slogan.meetingNotFound', 'Try later'),
					descriptionLabel: t(
						'meeting.infoPage.description.meetingNotFound',
						'Please check the meeting link and try again'
					)
				};
			}
		}
	}, [infoType, meetingId, t]);

	const { darkReaderStatus, disableDarkReader } = useDarkReader();

	useEffect(() => {
		disableDarkReader();
	}, [darkReaderStatus, disableDarkReader]);

	const handleHoverStar = useCallback((index: number) => {
		setHoveredStarIndex(index);
	}, []);

	const handleLeaveStar = useCallback(() => {
		setHoveredStarIndex(null);
	}, []);

	const onClick = useCallback(
		(rating: number) => {
			setClicked(true);
			capture(TRACKER_EVENT.meetingEvaluation, { app: CHATS_APP_ID, rating });
		},
		[capture]
	);

	const renderStars = useMemo(
		() =>
			map(range(1, 6), (i) => (
				<Container
					key={i}
					width="fit"
					height="fit"
					orientation="horizontal"
					onMouseEnter={() => handleHoverStar(i)}
					onMouseLeave={handleLeaveStar}
				>
					<StarIcon
						icon={hoveredStarIndex !== null && i <= hoveredStarIndex ? 'Star' : 'StarOutline'}
						color="warning"
						onClick={() => onClick(i)}
					/>
					{i < 5 && <Padding right="1.5rem" />}
				</Container>
			)),
		[handleHoverStar, handleLeaveStar, hoveredStarIndex, onClick]
	);

	return (
		<Container background={'gray0'}>
			<Container width="fit" minWidth="40%" maxWidth="100%" padding="1.5rem" gap="2rem">
				<Container height="fit" maxWidth="100%" gap="0.7rem">
					<Title color="gray6" weight="bold" overflow="break-word" textAlign="center">
						{titleLabel}
					</Title>
					<Text
						size="extralarge"
						color="gray6"
						weight="light"
						overflow="break-word"
						textAlign="center"
					>
						{descriptionLabel}
					</Text>
				</Container>
				<Container
					height="fit"
					maxWidth="100%"
					orientation="horizontal"
					padding={{ top: '1rem' }}
					gap="1rem"
				>
					<Divider />
					<Container width="fit" height="fit">
						<Slogan weight="bold" color="gray6">
							{sloganLabel.toUpperCase()}
						</Slogan>
					</Container>
					<Divider />
				</Container>
				{infoType && ![PAGE_INFO_TYPE.MEETING_DECLINED].includes(infoType) && (
					<Container gap="0.7rem" width="fit" height="fit">
						<Text color="gray6" overflow="break-word" textAlign="center">
							{meetingExperienceLabel}
						</Text>
						{clicked ? (
							<Feedback color="warning" weight="light">
								{thankYouLabel}
							</Feedback>
						) : (
							<Container orientation="horizontal" width="fit" height="fit">
								{renderStars}
							</Container>
						)}
						<Container width="fit" height="fit">
							<Text color="gray6">{opinionLabel}</Text>
							<Text color="gray6">{improveLabel}</Text>
						</Container>
					</Container>
				)}
			</Container>
		</Container>
	);
};

export default InfoPage;
