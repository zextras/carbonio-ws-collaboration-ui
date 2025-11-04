/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import AudioAndVideoCard from './AudioAndVideoCard';
import JoinAsGuestCard from './JoinAsGuestCard';
import useStore from '../../../../store/Store';
import Logo from '../../Logo';
import useAccessMeeting from '../useAccessMeeting';
import useExternalAccess from './useExternalAccess';

export type MediaStatus = {
	audio: {
		enabled: boolean;
		selectedDeviceId?: string;
	};
	video: {
		enabled: boolean;
		selectedDeviceId?: string;
	};
};

const MeetingExternalAccessPage = (): ReactElement => {
	const [mediaStatus, setMediaStatus] = useState<MediaStatus>({
		audio: { enabled: false },
		video: { enabled: false }
	});

	const queueId = useStore((state) => state.session.queueId);

	const { handleWaitingRoom, userIsReady } = useAccessMeeting(mediaStatus);
	const { meetingName, createGuestAccount } = useExternalAccess();

	const [t] = useTranslation();
	const titleLabel = t('welcomePage.title', 'Welcome to "{{title}}" virtual room', {
		title: meetingName
	});

	// Join waiting room automatically after guest login
	useEffect(() => {
		if (queueId) handleWaitingRoom();
	}, [queueId, handleWaitingRoom]);

	return (
		<Container background={'gray0'} height="fill" width="fill" style={{ position: 'relative' }}>
			<Logo />
			<Container width="65%" maxWidth="75rem" minWidth="35rem" height="fit" gap="1rem">
				<Container
					background={'gray6'}
					padding="large"
					width="fill"
					style={{ borderRadius: '1rem' }}
				>
					<Text weight="bold" style={{ fontSize: '24px' }}>
						{titleLabel}
					</Text>
				</Container>
				<Container orientation="horizontal" gap="1rem" width="fill">
					<AudioAndVideoCard mediaStatus={mediaStatus} setMediaStatus={setMediaStatus} />
					<JoinAsGuestCard userIsReady={userIsReady} createGuestAccount={createGuestAccount} />
				</Container>
			</Container>
		</Container>
	);
};

export default MeetingExternalAccessPage;
