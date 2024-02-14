/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components';

import RoomPictureHandler from './RoomPictureHandler';
import { UsersApi } from '../../../../network';
import { getCapability } from '../../../../store/selectors/SessionSelectors';
import {
	getUserEmail,
	getUserLastActivity,
	getUserName,
	getUserOnline,
	getUserPictureUpdatedAt
} from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { CapabilityType } from '../../../../types/store/SessionTypes';
import { getCalendarTime } from '../../../../utils/dateUtils';

type RoomPictureProps = {
	memberId: string;
};

const Presence = styled.div`
	width: 0.6rem;
	height: 0.6rem;
	background-color: ${({ theme }: { theme: DefaultTheme }): string =>
		theme.palette.success.regular};
	border: 0.0625rem solid ${(props): string => props.theme.palette.gray5.regular};
	border-radius: 50%;
	margin-right: 0.1875rem;
`;

const CustomText = styled(Text)<{ $hasPicture: boolean }>`
	text-overflow: ellipsis;
	text-shadow: ${({ $hasPicture }): string | false =>
		$hasPicture && '0.063rem 0.063rem 0.25rem #111'};
`;

const OneToOneRoomPictureHandler: FC<RoomPictureProps> = ({ memberId }) => {
	const canSeeUsersPresence = useStore((store) =>
		getCapability(store, CapabilityType.CAN_SEE_USERS_PRESENCE)
	);

	const [t] = useTranslation();
	const userOnlineLabel: string = t('status.online', 'Online');
	const userOfflineLabel: string = t('status.offline', 'Offline');

	const memberName: string | undefined = useStore((state) => getUserName(state, memberId)) || '';
	const memberEmail: string | undefined = useStore((state) => getUserEmail(state, memberId));
	const memberOnline: boolean | undefined = useStore((state) => getUserOnline(state, memberId));
	const memberLastActivity: number | undefined = useStore((state) =>
		getUserLastActivity(state, memberId)
	);
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, memberId)
	);

	const lastSeen: string = useMemo(
		() => (memberLastActivity ? getCalendarTime(memberLastActivity) : ''),
		[memberLastActivity]
	);

	const lastSeenLabel: string = t('status.lastSeen', `Last seen ${lastSeen}`, { lastSeen });

	const presenceLabel = useMemo(
		() => (memberOnline ? userOnlineLabel : memberLastActivity ? lastSeenLabel : userOfflineLabel),
		[memberOnline, memberLastActivity, userOnlineLabel, lastSeenLabel, userOfflineLabel]
	);

	const picture = useMemo(() => {
		if (userPictureUpdatedAt) {
			return `${UsersApi.getURLUserPicture(memberId)}?${userPictureUpdatedAt}`;
		}
		return false;
	}, [memberId, userPictureUpdatedAt]);

	const description = useMemo(() => {
		if (canSeeUsersPresence) {
			return (
				<Container orientation="horizontal" mainAlignment="flex-start" height="fit">
					{memberOnline && <Presence data-testid="user_presence_dot" />}
					{memberOnline && <Padding right={'0.25rem'} />}
					<CustomText size="small" color="gray6" $hasPicture={!!picture}>
						{presenceLabel}
					</CustomText>
				</Container>
			);
		}
		return null;
	}, [picture, canSeeUsersPresence, memberOnline, presenceLabel]);

	return (
		<RoomPictureHandler
			title={memberName || memberEmail || ''}
			description={description}
			picture={picture}
		/>
	);
};

export default OneToOneRoomPictureHandler;
