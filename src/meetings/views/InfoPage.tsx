/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, Divider, Icon, Padding, Text } from '@zextras/carbonio-design-system';
import { map, range } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useDarkReader from '../../hooks/useDarkReader';
import { MeetingRoutesParams, PAGE_INFO_TYPE } from '../../hooks/useRouting';
import { getIsLoggedUserExternal } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { BrowserUtils } from '../../utils/BrowserUtils';

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
	const { infoType }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	let titleLabel;
	let sloganLabel;
	let descriptionLabel;

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

	switch (infoType) {
		case PAGE_INFO_TYPE.ROOM_EMPTY:
			titleLabel = t('external.roomIsEmpty', 'This Room is empty');
			sloganLabel = t('tryLater', 'Try later');
			descriptionLabel = t('external.nobodyInTheRoom', 'It seems nobody is in this Room');
			break;
		case PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION:
			titleLabel = t(
				'meeting.openedInAnotherWindow',
				'This meeting is already open in another window'
			);
			sloganLabel = t('meeting.continueActiveSession', 'Continue the meeting in the new window');
			descriptionLabel = t(
				'meeting.noMoreActiveSession',
				'There cannot be more than one active session of the same meeting'
			);
			break;
		case PAGE_INFO_TYPE.HANG_UP_PAGE:
			titleLabel = t('meeting.infoPage.title.hangUp', 'You left the waiting room');
			sloganLabel = t('meeting.infoPage.slogan.hangUp', 'Maybe next time');
			descriptionLabel = t(
				'meeting.infoPage.description.hangUp',
				'We look forward to seeing you participate in future meetings'
			);
			break;
		case PAGE_INFO_TYPE.NEXT_TIME_PAGE:
			titleLabel = t('meeting.infoPage.title.rejected', 'Your access has been refused');
			sloganLabel = t('meeting.infoPage.slogan.rejected', 'Maybe next time');
			descriptionLabel = t(
				'meeting.infoPage.description.rejected',
				'The moderators have decided to deny your access to the meeting'
			);
			break;
		case PAGE_INFO_TYPE.MEETING_ENDED:
			titleLabel = t('notification.meeting.ended', 'Meeting Ended');
			sloganLabel = t('thanksForParticipating', 'Thanks for participating');
			descriptionLabel = t(
				'keepInTouchWithColleagues',
				"Keep in touch with your colleagues or join your groups' meeting rooms"
			);
			break;
		case PAGE_INFO_TYPE.UNAUTHENTICATED:
			titleLabel = t('meeting.infoPage.title.notAuthenticatedUser', 'You are not authenticated');
			sloganLabel = t(
				'meeting.infoPage.slogan.notAuthenticatedUser',
				'login to access the meeting'
			);
			descriptionLabel = t(
				'meeting.infoPage.description.notAuthenticatedUser',
				'You cannot join the meeting if you are not authenticated with your account'
			);
			break;
		case PAGE_INFO_TYPE.INVALID_WAITING_ROOM:
			titleLabel = t(
				'meeting.infoPage.title.invalidWaiting',
				'There are no moderators in the meeting'
			);
			sloganLabel = t('meeting.infoPage.slogan.invalidWaiting', 'Try again later');
			descriptionLabel = t(
				'meeting.infoPage.description.invalidWaiting',
				'You must be approved by a moderator to join this meeting.'
			);
			break;
		case PAGE_INFO_TYPE.MEETING_NOT_FOUND:
		default: {
			titleLabel = t(
				'meeting.infoPage.title.meetingNotFound',
				'The meeting you are looking for does not exist'
			);
			sloganLabel = t('meeting.infoPage.slogan.meetingNotFound', 'Try later');
			descriptionLabel = t(
				'meeting.infoPage.description.meetingNotFound',
				'Please check the meeting link and try again'
			);
			break;
		}
	}

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

	const onClick = useCallback(() => {
		setClicked(true);
	}, []);

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
						onClick={onClick}
					/>
					{i < 5 && <Padding right="1.5rem" />}
				</Container>
			)),
		[handleHoverStar, handleLeaveStar, hoveredStarIndex, onClick]
	);

	return (
		<Container background={'gray0'}>
			<Container width="fit" maxWidth="100%" padding="1.5rem" gap="2rem">
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
					<Container width="fit" height=" fit">
						<Text color="gray6">{opinionLabel}</Text>
						<Text color="gray6">{improveLabel}</Text>
					</Container>
				</Container>
			</Container>
		</Container>
	);
};

export default InfoPage;
