/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useState } from 'react';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import {
	Button,
	Container,
	Divider,
	Icon,
	Input,
	Row,
	Text
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

const rotateKeyframes = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const SpinningIcon = styled(Icon)`
	animation: ${rotateKeyframes} 2s linear infinite;
`;

type JoinAsGuestCardProps = {
	userIsReady: boolean;
	createGuestAccount: (guestName: string) => void;
};
const JoinAsGuestCard = ({
	userIsReady,
	createGuestAccount
}: JoinAsGuestCardProps): ReactElement => {
	const [t] = useTranslation();
	const subtitleLabel = t('welcomePage.joinAsGuest', 'Join as guest');
	const descriptionLabel = t('welcomePage.description', 'Enter your name to join this meeting');
	const inputLabel = t('welcomePage.inputPlaceholder', 'Enter your name');
	const buttonLabel = t('meeting.waitingRoom.ready', 'Ready to participate');
	const readyLabel = t('meeting.waitingRoom.userIsReady', "You're ready!");
	const waitingForModeratorLabel = t(
		'welcomePage.waitingForModerator',
		'A moderator will let you into the meeting in a few moments.'
	);
	const alreadyHaveAccountLabel = t(
		'welcomePage.alreadyHaveAccount',
		'Already have an account? Access with your credentials.'
	);
	const loginPageButtonLabel = t('welcomePage.loginButton', 'Go to your login page');

	const [guestName, setGuestName] = useState<string>('');

	const goToLoginPage = useCallback(() => {
		const meetingUrl = window.location.href;
		const domainUrl = /^(.*)\/carbonio/.exec(meetingUrl);
		if (domainUrl) {
			const urlUpdated = meetingUrl.replaceAll(/:/g, '%3A').replaceAll('/', '%2F');
			const loginUrl = `${domainUrl[1]}/static/login/?destinationUrl=${urlUpdated}`;
			window.location.replace(loginUrl);
		}
	}, []);

	const readyToParticipate = useCallback(() => {
		createGuestAccount(guestName);
	}, [createGuestAccount, guestName]);

	return (
		<Row
			orientation="vertical"
			background={'gray6'}
			height="fill"
			takeAvailableSpace
			padding="extralarge"
			gap="1rem"
			style={{ borderRadius: '1rem' }}
		>
			<Text weight="bold" style={{ fontSize: '24px' }}>
				{subtitleLabel}
			</Text>
			<Text overflow="break-word" textAlign="center">
				{descriptionLabel}
			</Text>
			<Input
				label={inputLabel}
				onChange={(ev) => setGuestName(ev.target.value)}
				value={guestName}
				disabled={userIsReady}
				onEnter={readyToParticipate}
			/>
			{!userIsReady ? (
				<Button
					width="fill"
					label={buttonLabel}
					color="success"
					onClick={readyToParticipate}
					disabled={guestName.trim().length === 0 || userIsReady}
				/>
			) : (
				<Container height="fit" gap="1rem">
					<Container height="fit" gap="0.5rem">
						<Container orientation="horizontal" gap="0.5rem" height="fit">
							<Icon icon="CheckmarkCircle2" color="success" size="large" />
							<Text size="large" weight="bold">
								{readyLabel}
							</Text>
						</Container>
						<Text size="small" overflow="break-word" textAlign="center">
							{waitingForModeratorLabel}
						</Text>
					</Container>
					<SpinningIcon icon="LoaderOutline" color="gray0" size="large" />
				</Container>
			)}
			<Container padding={{ horizontal: 'medium' }} width="fill" height="fit">
				<Divider />
			</Container>
			<Text size="small" overflow="break-word" textAlign="center">
				{alreadyHaveAccountLabel}
			</Text>
			<Button width="fill" label={loginPageButtonLabel} onClick={goToLoginPage} type="outlined" />
		</Row>
	);
};

export default JoinAsGuestCard;
