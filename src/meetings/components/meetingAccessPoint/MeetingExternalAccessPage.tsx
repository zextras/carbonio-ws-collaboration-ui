/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	CreateSnackbarFn,
	Input,
	Padding,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRouting from '../../../hooks/useRouting';
import { MeetingsApi, SessionApi } from '../../../network';
import { WebSocketClient } from '../../../network/websocket/WebSocketClient';
import XMPPClient from '../../../network/xmpp/XMPPClient';
import useStore from '../../../store/Store';
import { BrowserUtils } from '../../../utils/BrowserUtils';
import ExternalAccessBackground from '../../assets/ExternalAccessBackground.png';

const CustomContainer = styled(Container)`
	box-shadow: 0 0.125rem 0.375rem 0 rgba(0, 0, 0, 0.25);
	border-radius: 0.125rem;
`;

const CustomText = styled(Text)`
	font-size: 2.625rem;
`;

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

const BackgroundContainer = styled(Container)`
	background-image: url(${(): string => ExternalAccessBackground});
	background-size: cover;
	aspect-ratio: 1/1;
`;

const MeetingExternalAccessPage = (): ReactElement => {
	const [t] = useTranslation();
	const welcomePageTitle = t('welcomePage.blob', 'Hey stranger!');
	const nameInput = t('welcomePage.nameInput', 'Type here your name');
	const joinButton = t('welcomePage.joinButton', 'Join the meeting');
	const welcomePageDescription = t(
		'welcomePage.description',
		'How would you like to introduce yourself?'
	);
	const enterMeetingDescription = t(
		'welcomePage.journeyDescription',
		'You will be redirected to the waiting room where a moderator will approve your access.'
	);
	const generalErrorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);

	const setXmppClient = useStore((state) => state.setXmppClient);
	const setWebSocketClient = useStore((state) => state.setWebSocketClient);
	const setChatsBeStatus = useStore((state) => state.setChatsBeStatus);
	const setLoginInfo = useStore((state) => state.setLoginInfo);

	const createSnackbar: CreateSnackbarFn = useSnackbar();
	const { goToMeetingAccessPage } = useRouting();

	const [userName, setUserName] = useState<string>('');

	const handleInputChange = useCallback((ev: React.FormEvent<HTMLInputElement>): void => {
		setUserName(ev.currentTarget.value);
	}, []);

	const isButtonDisabled = useMemo(() => userName.length === 0, [userName.length]);

	const errorSnackbar = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'error',
			label: generalErrorSnackbar,
			hideButton: true,
			autoHideTimeout: 5000
		});
	}, [createSnackbar, generalErrorSnackbar]);

	const handleCreateExternalUser = useCallback(() => {
		MeetingsApi.createGuestAccount(userName)
			.then((res) => {
				document.cookie = `ZM_AUTH_TOKEN=${res.zmToken}; path=/`;
				document.cookie = `ZX_AUTH_TOKEN=${res.zxToken}; path=/`;
				setLoginInfo(res.id, userName, userName);

				// NETWORKS: init XMPP and WebSocket clients
				const xmppClient = new XMPPClient();
				setXmppClient(xmppClient);
				const webSocket = new WebSocketClient();
				setWebSocketClient(webSocket);

				SessionApi.getCapabilities()
					.then(() => {
						setChatsBeStatus(true);
						xmppClient.connect(res.zmToken);
						webSocket.connect();
						goToMeetingAccessPage();
					})
					.catch(() => {
						BrowserUtils.clearAuthCookies();
						setChatsBeStatus(false);
						errorSnackbar();
					});
			})
			.catch(() => {
				errorSnackbar();
			});
	}, [
		errorSnackbar,
		goToMeetingAccessPage,
		setChatsBeStatus,
		setLoginInfo,
		setWebSocketClient,
		setXmppClient,
		userName
	]);

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
						<CustomText size="large" weight="bold">
							{welcomePageTitle}
						</CustomText>
						<Text>{welcomePageDescription}</Text>
						<Input label={nameInput} value={userName} onChange={handleInputChange} />
						<CustomButton
							data-testid="join_button"
							width="fill"
							label={joinButton}
							onClick={handleCreateExternalUser}
							disabled={isButtonDisabled}
						/>
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
