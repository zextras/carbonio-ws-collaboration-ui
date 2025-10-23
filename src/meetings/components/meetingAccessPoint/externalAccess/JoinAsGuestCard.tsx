/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useState } from 'react';

import {
	Button,
	Container,
	Divider,
	Icon,
	Input,
	Row,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MeetingsApi } from '../../../../network';
import useStore from '../../../../store/Store';
import { UserType } from '../../../../types/store/UserTypes';

type JoinAsGuestCardProps = {
	userIsReady: boolean;
};
const JoinAsGuestCard = ({ userIsReady }: JoinAsGuestCardProps): ReactElement => {
	const [t] = useTranslation(); // TODO: translation keys
	const subtitleLabel = t('', 'Join as guest');
	const descriptionLabel = t('', 'Enter your name to join this meeting');
	const inputLabel = t('', 'Enter your name');
	const buttonLabel = t('', 'Ready to participate');
	const readyLabel = t('meeting.waitingRoom.userIsReady', "You're ready!");
	const waitingForModeratorLabel = t(
		'',
		'A moderator will let you into the meeting in a few moments.'
	);
	const alreadyHaveAccountLabel = t('', 'Already have an account? Access with your credentials.');
	const loginPageButtonLabel = t('', 'Go to your login page');
	const generalErrorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);

	const [guestName, setGuestName] = useState<string>('');

	const createSnackbar = useSnackbar();

	const readyToParticipate = useCallback(() => {
		const { setLoginInfo, setChatsBeStatus, setAttributes } = useStore.getState();
		MeetingsApi.createGuestAccount(guestName)
			.then((res) => {
				document.cookie = `ZM_AUTH_TOKEN=${res.zmToken}; path=/`;
				document.cookie = `ZX_AUTH_TOKEN=${res.zxToken}; path=/`;
				setLoginInfo(res.id, guestName, guestName, UserType.GUEST);

				setChatsBeStatus(true);
				const { xmppClient, wsClient } = useStore.getState().connections;
				xmppClient.connect(res.zmToken);
				wsClient.connect();

				setAttributes({
					carbonioWscShowMessageReads: 'TRUE',
					carbonioWscMessageDeleteTimeLimit: '10m',
					carbonioWscMessageEditTimeLimit: '10m'
				});
			})
			.catch(() => {
				setChatsBeStatus(false);
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'error',
					label: generalErrorSnackbar,
					hideButton: true,
					autoHideTimeout: 5000
				});
			});
	}, [createSnackbar, generalErrorSnackbar, guestName]);

	const goToLoginPage = useCallback(() => {
		const meetingUrl = window.location.href;
		const domainUrl = /^(.*)\/carbonio/.exec(meetingUrl);
		if (domainUrl) {
			const urlUpdated = meetingUrl.replaceAll(/:/g, '%3A').replaceAll('/', '%2F');
			const loginUrl = `${domainUrl[1]}/static/login/?destinationUrl=${urlUpdated}`;
			window.location.replace(loginUrl);
		}
	}, []);

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
					<Icon icon="LoaderOutline" color="gray0" size="large" />
				</Container>
			)}
			<Container padding="medium" width="fill" height="fit">
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
