/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Avatar, Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useAvatarUtilities from '../../../../hooks/useAvatarUtilities';
import { getStartRecordingUserId } from '../../../../store/selectors/MeetingSelectors';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

type StartRecordingUserProps = {
	meetingId: string;
};

const StartRecordingUser = ({ meetingId }: StartRecordingUserProps): ReactElement | null => {
	const [t] = useTranslation();
	const hasStartedRecordingLabel = t(
		'meeting.sidebar.recording.moderatorInfo',
		'has started recording'
	);

	const startRecordingUserId = useStore((state) => getStartRecordingUserId(state, meetingId)) ?? '';
	const memberName: string = useStore((store) => getUserName(store, startRecordingUserId));

	const { avatarPicture, avatarIcon, avatarColor } = useAvatarUtilities(startRecordingUserId ?? '');

	if (!startRecordingUserId) return null;
	return (
		<Container orientation="horizontal" gap="0.5rem">
			<CustomAvatar
				label={memberName}
				shape="round"
				picture={avatarPicture}
				icon={avatarIcon}
				background={avatarColor}
			/>
			<Container crossAlignment="flex-start">
				<Text>{memberName}</Text>
				<Text color="gray1" size="small">
					{hasStartedRecordingLabel}
				</Text>
			</Container>
		</Container>
	);
};

export default StartRecordingUser;
