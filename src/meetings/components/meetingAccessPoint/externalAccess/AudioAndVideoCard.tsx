/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MediaStatus } from './MeetingExternalAccessPage';

type AudioAndVideoCardProps = {
	mediaStatus: MediaStatus;
	setMediaStatus?: (status: MediaStatus) => void;
};

const AudioAndVideoCard = ({
	mediaStatus,
	setMediaStatus
}: AudioAndVideoCardProps): ReactElement => (
	<Container background={'gray6'} width="fit" padding="extralarge" style={{ borderRadius: '1rem' }}>
		video e controlli
	</Container>
);

export default AudioAndVideoCard;
