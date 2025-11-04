/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable jsx-a11y/media-has-caption */
import React, { ReactElement, useEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Icon, Input, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getCustomLogo } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import defaultLogo from '../../assets/Logo.png';
import AccessTile from '../../components/meetingAccessPoint/AccessTile';
import { SpinningIcon } from '../../components/meetingAccessPoint/externalAccess/JoinAsGuestCard';
import useExternalAccess from '../../components/meetingAccessPoint/externalAccess/useExternalAccess';
import useAccessMeeting from '../../components/meetingAccessPoint/useAccessMeeting';

const LogoApp = styled.img`
	width: 12rem;
	height: auto;
	object-fit: contain;
`;

const MeetingExternalAccessMobilePage = (): ReactElement => {
	const [guestName, setGuestName] = useState<string>('');
	const [audioStatus, setAudioStatus] = useState<boolean>(false);

	const videoStreamRef = useRef<HTMLVideoElement>(null);

	const customLogo = useStore(getCustomLogo);
	const queueId = useStore((state) => state.session.queueId);

	const { handleWaitingRoom, userIsReady } = useAccessMeeting({
		audio: { enabled: audioStatus },
		video: { enabled: false }
	});
	const { meetingName, createGuestAccount } = useExternalAccess();

	const [t] = useTranslation();
	const titleLabel = t('welcomePage.title', 'Welcome to "{{title}}" virtual room', {
		title: meetingName
	});
	const subtitleLabel = t('welcomePage.joinAsGuest', 'Join as guest');
	const descriptionLabel = t('welcomePage.description', 'Enter your name to join this meeting');
	const inputLabel = t('welcomePage.inputPlaceholder', 'Enter your name');
	const buttonLabel = t('meeting.waitingRoom.ready', 'Ready to participate');
	const readyLabel = t('meeting.waitingRoom.userIsReady', "You're ready!");
	const waitingForModeratorLabel = t(
		'welcomePage.waitingForModerator',
		'A moderator will let you into the meeting in a few moments.'
	);

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
							onClick={() => createGuestAccount(guestName)}
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
						<SpinningIcon icon="LoaderOutline" color="gray0" size="large" />
					</Container>
				)}
			</Container>
		</Container>
	);
};

export default MeetingExternalAccessMobilePage;
