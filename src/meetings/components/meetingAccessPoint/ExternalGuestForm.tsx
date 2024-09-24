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
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRouting from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { WebSocketClient } from '../../../network/websocket/WebSocketClient';
import XMPPClient from '../../../network/xmpp/XMPPClient';
import useStore from '../../../store/Store';
import { UserType } from '../../../types/store/UserTypes';
import { BrowserUtils } from '../../../utils/BrowserUtils';

const CustomText = styled(Text)`
	font-size: 2.625rem;
	text-align: center;
`;

const CustomSubtitle = styled(Text)`
	text-align: center;
`;

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

const ExternalGuestForm = (): ReactElement => {
	const [t] = useTranslation();
	const welcomePageTitle = t('welcomePage.blob', 'Hey stranger!');
	const nameInput = t('welcomePage.nameInput', 'Type here your name');
	const joinButton = t('welcomePage.joinButton', 'Join the meeting');
	const welcomePageDescription = t(
		'welcomePage.description',
		'How would you like to introduce yourself?'
	);
	const generalErrorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);

	const setXmppClient = useStore((state) => state.setXmppClient);
	const setWebSocketClient = useStore((state) => state.setWebSocketClient);
	const setChatsBeStatus = useStore((state) => state.setChatsBeStatus);
	const setLoginInfo = useStore((state) => state.setLoginInfo);
	const setCapabilities = useStore((store) => store.setCapabilities);

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
			severity: 'error',
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
				setLoginInfo(res.id, userName, userName, UserType.GUEST);

				// NETWORKS: init XMPP and WebSocket clients
				const xmppClient = new XMPPClient();
				setXmppClient(xmppClient);
				const webSocket = new WebSocketClient();
				setWebSocketClient(webSocket);

				setChatsBeStatus(true);
				xmppClient.connect(res.zmToken);
				webSocket.connect();

				setCapabilities({
					canSeeMessageReads: true,
					deleteMessageTimeLimitInMinutes: 10,
					editMessageTimeLimitInMinutes: 10
				});

				goToMeetingAccessPage();
			})
			.catch(() => {
				BrowserUtils.clearAuthCookies();
				setChatsBeStatus(false);
				errorSnackbar();
			});
	}, [
		errorSnackbar,
		goToMeetingAccessPage,
		setCapabilities,
		setChatsBeStatus,
		setLoginInfo,
		setWebSocketClient,
		setXmppClient,
		userName
	]);

	return (
		<Container mainAlignment="flex-start" gap="1.5rem" height="fit">
			<CustomText size="large" weight="bold" overflow="break-word">
				{welcomePageTitle}
			</CustomText>
			<CustomSubtitle overflow="break-word">{welcomePageDescription}</CustomSubtitle>
			<Input label={nameInput} value={userName} onChange={handleInputChange} />
			<CustomButton
				data-testid="join_button"
				width="fill"
				label={joinButton}
				onClick={handleCreateExternalUser}
				disabled={isButtonDisabled}
			/>
		</Container>
	);
};

export default ExternalGuestForm;
