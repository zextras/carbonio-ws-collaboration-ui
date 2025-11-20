/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import RoomPictureHandler from './RoomPictureHandler';
import useAvatarUtilities from '../../../../hooks/useAvatarUtilities';
import { getAttribute } from '../../../../store/selectors/SessionSelectors';
import {
	getUserLastActivity,
	getUserName,
	getUserOnline
} from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { getCalendarTime } from '../../../../utils/dateUtils';

type RoomPictureProps = {
	memberId: string;
};

const Presence = styled.div`
	width: 0.6rem;
	height: 0.6rem;
	background-color: ${({ theme }): string => theme.palette.success.regular};
	border: 0.0625rem solid ${(props): string => props.theme.palette.gray5.regular};
	border-radius: 50%;
`;

const CustomText = styled(Text)<{ $hasPicture: boolean }>`
	text-overflow: ellipsis;
	text-shadow: ${({ $hasPicture }): string | false =>
		$hasPicture && '0.063rem 0.063rem 0.25rem #111'};
`;

const OneToOneRoomPictureHandler: FC<RoomPictureProps> = ({ memberId }) => {
	const showUsersPresence = useStore((store) => getAttribute(store, 'showUsersPresence'));

	const [t] = useTranslation();
	const userOnlineLabel: string = t('status.online', 'Online');
	const userOfflineLabel: string = t('status.offline', 'Offline');

	const memberName: string = useStore((state) => getUserName(state, memberId));
	const memberOnline: boolean = useStore((state) => getUserOnline(state, memberId));
	const memberLastActivity: number | undefined = useStore((state) =>
		getUserLastActivity(state, memberId)
	);
	const lastSeen: string = useMemo(
		() => (memberLastActivity ? getCalendarTime(memberLastActivity) : ''),
		[memberLastActivity]
	);

	const lastSeenLabel: string = t('status.lastSeen', `Last seen ${lastSeen}`, { lastSeen });

	const { avatarPicture, avatarColor } = useAvatarUtilities(memberId);

	const presenceLabel = useMemo(() => {
		if (memberOnline) return userOnlineLabel;
		if (memberLastActivity) return lastSeenLabel;
		return userOfflineLabel;
	}, [memberOnline, memberLastActivity, userOnlineLabel, lastSeenLabel, userOfflineLabel]);

	const description = useMemo(() => {
		if (showUsersPresence) {
			return (
				<Container
					orientation="horizontal"
					mainAlignment="flex-start"
					height="fit"
					width="fill"
					gap={'0.25rem'}
				>
					{memberOnline && <Presence data-testid="user_presence_dot" />}
					<CustomText size="small" color="gray6" $hasPicture={!!avatarPicture}>
						{presenceLabel}
					</CustomText>
				</Container>
			);
		}
		return null;
	}, [avatarPicture, showUsersPresence, memberOnline, presenceLabel]);

	return (
		<RoomPictureHandler
			title={memberName}
			description={description}
			picture={avatarPicture}
			backgroundColor={avatarColor}
		/>
	);
};

export default OneToOneRoomPictureHandler;
