/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useDarkReader from '../../hooks/useDarkReader';
import { MeetingRoutesParams, PAGE_INFO_TYPE } from '../../hooks/useRouting';
import { getIsLoggedUserExternal } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { BrowserUtils } from '../../utils/BrowserUtils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import sloganGif from '../assets/infoPageSlogan.gif';

const CustomContainer = styled(Container)`
	background: linear-gradient(287deg, #0f0f34 0%, #2c4579 74.63%);
`;

const BoxText = styled(Container)`
	border-radius: 1.25rem;
	box-shadow: 4px 4px 4px 0px rgba(0, 0, 0, 0.25);
`;

const Title = styled(Text)`
	font-size: 1.75rem;
	color: #93b2f4;
`;

const Description = styled(Text)`
	font-size: 1.125rem;
`;

const Slogan = styled(Text)`
	font-size: 1.375rem;
`;

const InfoPageGif = styled.img<{ src: string }>`
	width: 3rem;
	border-radius: 50%;
	transform: scaleX(-1);
	box-shadow: 4px 4px 4px 0px rgba(0, 0, 0, 0.25);
`;

const InfoPage = (): ReactElement => {
	const { infoType }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	let titleLabel;
	let sloganLabel;
	let descriptionLabel;

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

	return (
		<CustomContainer
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			padding={{ top: '25vh', left: '15vw' }}
			gap="1rem"
		>
			<BoxText
				height="fit"
				width="fit"
				padding={{ vertical: '3.125rem', horizontal: '2.5rem' }}
				gap="1rem"
				crossAlignment="flex-start"
				background="text"
			>
				<Title>{titleLabel.toUpperCase()}</Title>
				<Description size="extralarge" color="gray6">
					{descriptionLabel}
				</Description>
			</BoxText>
			<Container
				height="fit"
				width="fit"
				orientation="horizontal"
				padding={{ top: '1rem' }}
				gap="1rem"
			>
				<InfoPageGif src={sloganGif} />
				<Slogan weight="bold" color="gray6">
					{sloganLabel.toUpperCase()}
				</Slogan>
			</Container>
		</CustomContainer>
	);
};

export default InfoPage;
