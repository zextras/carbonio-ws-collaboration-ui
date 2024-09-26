/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ExternalAccessBackground from '../../assets/ExternalAccessBackground.png';
import ExternalGuestForm from '../../components/meetingAccessPoint/ExternalGuestForm';

const CustomDescription = styled(Text)`
	text-align: center;
`;

const BackgroundContainer = styled(Container)`
	background-image: url(${(): string => ExternalAccessBackground});
	background-size: cover;
	aspect-ratio: 1/1;
	background-position: center;
`;

const MeetingExternalAccessMobilePage = (): ReactElement => {
	const [t] = useTranslation();
	const enterMeetingDescription = t(
		'welcomePage.journeyDescription',
		'You will be redirected to the waiting room where a moderator will approve your access.'
	);

	return (
		<BackgroundContainer padding="2rem">
			<Container
				height="fit"
				background={'gray6'}
				padding={{ vertical: '4rem', horizontal: '2rem' }}
				crossAlignment="center"
			>
				<ExternalGuestForm />
				<Padding bottom="2rem" />
				<CustomDescription overflow="break-word">{enterMeetingDescription}</CustomDescription>
			</Container>
		</BackgroundContainer>
	);
};

export default MeetingExternalAccessMobilePage;
