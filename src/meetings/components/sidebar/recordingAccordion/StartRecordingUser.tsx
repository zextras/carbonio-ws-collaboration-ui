/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Avatar, Container, Shimmer, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { UsersApi } from '../../../../network';
import { getStartRecordingUserId } from '../../../../store/selectors/MeetingSelectors';
import { getUserName, getUserPictureUpdatedAt } from '../../../../store/selectors/UsersSelectors';
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
	const memberName: string | undefined = useStore((store) =>
		getUserName(store, startRecordingUserId)
	);
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, startRecordingUserId)
	);

	const picture = useMemo(() => {
		if (userPictureUpdatedAt != null) {
			return `${UsersApi.getURLUserPicture(startRecordingUserId)}?${userPictureUpdatedAt}`;
		}
		return '';
	}, [startRecordingUserId, userPictureUpdatedAt]);

	const avatarElement = useMemo(
		() =>
			memberName == null ? (
				<Container width="fit" height="fit">
					<Shimmer.Avatar width="2rem" />
				</Container>
			) : (
				<CustomAvatar label={memberName} shape="round" picture={picture} />
			),
		[memberName, picture]
	);

	if (!startRecordingUserId) return null;
	return (
		<Container orientation="horizontal" gap="0.5rem">
			{avatarElement}
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
