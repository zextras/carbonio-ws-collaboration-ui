/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable jsx-a11y/media-has-caption */
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Icon, Input, Text, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MEETINGS_PATH } from '../../../constants/appConstants';
import useRouting from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { getCustomLogo } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { UserType } from '../../../types/store/UserTypes';
import { BrowserUtils } from '../../../utils/BrowserUtils';
import defaultLogo from '../../assets/Logo.png';
import AccessTile from '../../components/meetingAccessPoint/AccessTile';
import useAccessMeeting from '../../components/meetingAccessPoint/useAccessMeeting';
import { PAGE_INFO_TYPE } from '../../contexts/routerContext';

const LogoApp = styled.img`
	width: 12rem;
	height: auto;
	object-fit: contain;
`;

const MeetingExternalAccessMobilePage = (): ReactElement => {
	const [meetingName, setMeetingName] = useState<string>('');
	const [guestName, setGuestName] = useState<string>('');
	const [audioStatus, setAudioStatus] = useState<boolean>(false);

	const videoStreamRef = useRef<HTMLVideoElement>(null);

	const customLogo = useStore(getCustomLogo);
	const queueId = useStore((state) => state.session.queueId);

	const { handleWaitingRoom, userIsReady } = useAccessMeeting({
		audio: { enabled: audioStatus },
		video: { enabled: false }
	});

	const { goToInfoPage } = useRouting();

	const createSnackbar = useSnackbar();

	useEffect(() => {
		const meetingId = window.location.pathname.split(MEETINGS_PATH)[1];
		MeetingsApi.getScheduledMeetingName(meetingId)
			.then((resp) => {
				setMeetingName(resp.name);
			})
			.catch(() => {
				goToInfoPage(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
			});
	}, [goToInfoPage]);

	const [t] = useTranslation(); // TODO: translation keys
	const titleLabel = t('', 'Welcome to "{{title}}" virtual room', { title: meetingName });
	const subtitleLabel = t('', 'Join as guest');
	const descriptionLabel = t('', 'Enter your name to join this meeting');
	const inputLabel = t('', 'Enter your name');
	const buttonLabel = t('', 'Ready to participate');
	const readyLabel = t('meeting.waitingRoom.userIsReady', "You're ready!");
	const waitingForModeratorLabel = t(
		'',
		'A moderator will let you into the meeting in a few moments.'
	);
	const generalErrorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);

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
				BrowserUtils.clearAuthCookies();
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

	// Join waiting room automatically after guest login
	useEffect(() => {
		if (queueId) handleWaitingRoom();
	}, [queueId, handleWaitingRoom]);

	return (
		<Container background="gray0" height="fill" width="fill" padding="large" gap="1rem">
			<LogoApp src={customLogo || defaultLogo} />
			<Container
				background={'gray6'}
				padding="large"
				height="fit"
				width="fill"
				style={{ borderRadius: '1rem' }}
			>
				<Text weight="bold" style={{ fontSize: '24px' }} overflow="break-word" textAlign="center">
					{titleLabel}
				</Text>
			</Container>
			<Container
				orientation="vertical"
				background="gray6"
				padding="large"
				gap="1rem"
				width="fill"
				height="fit"
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
				/>
				<AccessTile
					videoStreamRef={videoStreamRef}
					videoPlayerTestMuted
					mediaDevicesEnabled={{
						audio: audioStatus,
						video: false
					}}
				/>
				{!userIsReady ? (
					<Container orientation="horizontal" gap="1rem" height="fit">
						<Button
							onClick={() => setAudioStatus((prev) => !prev)}
							color="primary"
							size="large"
							minWidth="large"
							icon={audioStatus ? 'Mic' : 'MicOff'}
						/>
						<Button
							width="fill"
							label={buttonLabel}
							color="success"
							onClick={readyToParticipate}
							disabled={guestName.trim().length === 0 || userIsReady}
						/>
					</Container>
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
			</Container>
		</Container>
	);
};

export default MeetingExternalAccessMobilePage;
