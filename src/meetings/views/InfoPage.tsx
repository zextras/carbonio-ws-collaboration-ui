/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

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
	text-transform: capitalize;
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
	const { infoType }: Record<string, InfoType> = useParams();

	const [t] = useTranslation();
	let titleLabel;
	let centralLabel;
	let descriptionLowerLabel;

	switch (infoType) {
		case 'room_empty':
			titleLabel = t('external.roomIsEmpty', 'This Room is empty');
			centralLabel = t('tryLater', 'Try later');
			descriptionLowerLabel = t('external.nobodyInTheRoom', 'It seems nobody is in this Room');
			break;
		case 'meeting_ended':
			titleLabel = t('notification.meeting.ended', 'Meeting Ended');
			centralLabel = t('thanksForParticipating', 'Thanks for participating');
			descriptionLowerLabel = t(
				'keepInTouchWithColleagues',
				"Keep in touch with your colleagues or join your groups' meeting rooms"
			);
			break;
		default:
			titleLabel = t('notification.meeting.ended', 'Meeting Ended');
			centralLabel = t('thanksForParticipating', 'Thanks for participating');
			descriptionLowerLabel = t(
				'keepInTouchWithColleagues',
				"Keep in touch with your colleagues or join your groups' meeting rooms"
			);
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

export type InfoType = 'room_empty' | 'meeting_ended';
