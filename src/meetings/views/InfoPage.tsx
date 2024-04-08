/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { MeetingRoutesParams, PAGE_INFO_TYPE } from '../../hooks/useRouting';

const CustomContainer = styled(Container)`
	z-index: 10;
	position: fixed;
	height: 100%;
	width: 100%;
	top: 0;
`;

const MainTextWrapper = styled(Container)`
	color: ${({ theme }): string => theme.palette.primary.regular};
	font-size: 2.25rem;
	margin-top: 1.875rem;
	font-weight: bold;
`;

const ErrorWrapper = styled(Container)`
	margin: 3rem 0;
`;

const ErrorCode = styled(Container)`
	color: #4d4d4d;
	font-weight: 300;
	font-size: 0.875rem;
	line-height: 1.3125rem;
	padding: 0 3.125rem;
	text-transform: uppercase;
`;

const InfoPage = (): ReactElement => {
	const { infoType }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	let titleLabel;
	let centralLabel;
	let descriptionLowerLabel;

	switch (infoType) {
		case PAGE_INFO_TYPE.ROOM_EMPTY:
			titleLabel = t('external.roomIsEmpty', 'This Room is empty');
			centralLabel = t('tryLater', 'Try later');
			descriptionLowerLabel = t('external.nobodyInTheRoom', 'It seems nobody is in this Room');
			break;
		case PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION:
			titleLabel = t(
				'meeting.openedInAnotherWindow',
				'This meeting is already open in another window'
			);
			centralLabel = t('meeting.continueActiveSession', 'Continue the meeting in the new window');
			descriptionLowerLabel = t(
				'meeting.noMoreActiveSession',
				'There cannot be more than one active session of the same meeting'
			);
			break;
		case PAGE_INFO_TYPE.HANG_UP_PAGE:
			titleLabel = t('meeting.infoPage.title.hangUp', 'You left the waiting room');
			centralLabel = t('meeting.infoPage.slogan.hangUp', 'Maybe next time');
			descriptionLowerLabel = t(
				'meeting.infoPage.description.hangUp',
				'We look forward to seeing you participate in future meetings'
			);
			break;
		case PAGE_INFO_TYPE.NEXT_TIME_PAGE:
			titleLabel = t('meeting.infoPage.title.rejected', 'Your access has been refused');
			centralLabel = t('meeting.infoPage.slogan.rejected', 'Maybe next time');
			descriptionLowerLabel = t(
				'meeting.infoPage.description.rejected',
				'The moderators have decided to deny your access to the meeting'
			);
			break;
		case PAGE_INFO_TYPE.MEETING_ENDED:
			titleLabel = t('notification.meeting.ended', 'Meeting Ended');
			centralLabel = t('thanksForParticipating', 'Thanks for participating');
			descriptionLowerLabel = t(
				'keepInTouchWithColleagues',
				"Keep in touch with your colleagues or join your groups' meeting rooms"
			);
			break;
		case PAGE_INFO_TYPE.UNAUTHENTICATED:
			titleLabel = t('meeting.infoPage.title.notAuthenticatedUser', 'You are not authenticated');
			centralLabel = t(
				'meeting.infoPage.slogan.notAuthenticatedUser',
				'login to access the meeting'
			);
			descriptionLowerLabel = t(
				'meeting.infoPage.description.notAuthenticatedUser',
				'You cannot join the meeting if you are not authenticated with your account'
			);
			break;
		case PAGE_INFO_TYPE.MEETING_NOT_FOUND:
		default: {
			titleLabel = t(
				'meeting.infoPage.title.meetingNotFound',
				'The meeting you are looking for does not exist'
			);
			centralLabel = t('meeting.infoPage.slogan.meetingNotFound', 'Try later');
			descriptionLowerLabel = t(
				'meeting.infoPage.description.meetingNotFound',
				'Please check the meeting link and try again'
			);
			break;
		}
	}

	return (
		<CustomContainer>
			<MainTextWrapper height="fit" width="fit">
				{titleLabel}
			</MainTextWrapper>
			<ErrorWrapper height="fit" width="fit" orientation="horizontal">
				<Container height="0.0625rem" width="6.25rem" background="gray1" />
				<ErrorCode height="fit" width="fit">
					{centralLabel}
				</ErrorCode>
				<Container height="0.0625rem" width="6.25rem" background="gray1" />
			</ErrorWrapper>
			<Padding vertical="large">
				<Text weight="light">{descriptionLowerLabel}</Text>
			</Padding>
		</CustomContainer>
	);
};

export default InfoPage;
