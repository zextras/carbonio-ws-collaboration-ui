/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { Button, Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ExternalGuestForm from './ExternalGuestForm';
import ExternalAccessBackground from '../../assets/ExternalAccessBackground.png';

const CustomContainer = styled(Container)`
	box-shadow: 0 0.125rem 0.375rem 0 rgba(0, 0, 0, 0.25);
	border-radius: 0.125rem;
`;

const CustomDescription = styled(Text)`
	text-align: center;
`;

const BackgroundContainer = styled(Container)`
	background-image: url(${(): string => ExternalAccessBackground});
	background-size: cover;
	aspect-ratio: 1/1;
`;

const MeetingExternalAccessPage = (): ReactElement => {
	const [t] = useTranslation();
	const loginButton = t('welcomePage.loginButton', 'Go to your login page');
	const accountTitle = t('welcomePage.loginTitle', 'Do you have an account?');
	const accountDescription = t(
		'welcomePage.loginDescription',
		'Choose freely whether to go to the login page or simply access the meeting with your name.'
	);
	const enterMeetingDescription = t(
		'welcomePage.journeyDescription',
		'You will be redirected to the waiting room where a moderator will approve your access.'
	);

	const handleRedirectLogin = useCallback(() => {
		const meetingUrl = window.location.href;
		const domainUrl = /^(.*)\/carbonio/.exec(meetingUrl);
		if (domainUrl) {
			const urlUpdated = meetingUrl.replaceAll(/:/g, '%3A').replaceAll('/', '%2F');
			const loginUrl = `${domainUrl[1]}/static/login/?destinationUrl=${urlUpdated}`;
			window.location.replace(loginUrl);
		}
	}, []);

	return (
		<BackgroundContainer>
			<Container crossAlignment="flex-start" padding="6.25rem" data-testid="external_access_page">
				<CustomContainer
					mainAlignment="flex-start"
					background={'gray6'}
					width="27.25rem"
					height="fit"
					maxHeight="38.75rem"
					padding="4rem"
				>
					<Container mainAlignment="flex-start" gap="1.5rem" height="fit">
						<ExternalGuestForm />
						<Divider color="gray2" />
						<Container gap="0.5rem" height="fit">
							<Text>{accountTitle}</Text>
							<CustomDescription overflow="break-word" size="small">
								{accountDescription}
							</CustomDescription>
							<Button
								type="ghost"
								width="fill"
								label={loginButton}
								onClick={handleRedirectLogin}
								data-testid="login_button"
							/>
						</Container>
					</Container>
					<Padding bottom="4rem" />
					<Text overflow="break-word" size="small">
						{enterMeetingDescription}
					</Text>
				</CustomContainer>
			</Container>
		</BackgroundContainer>
	);
};

export default MeetingExternalAccessPage;
