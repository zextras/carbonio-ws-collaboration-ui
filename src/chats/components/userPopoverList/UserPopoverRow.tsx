/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import styled from '@emotion/styled';
import { Avatar, Container, Shimmer, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useAvatarUtilities from '../../../hooks/useAvatarUtilities';
import { getAttribute, getIsLoggedUser } from '../../../store/selectors/SessionSelectors';
import { getUserName, getUserOnline } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';

const CustomAvatar = styled(Avatar)`
	min-width: 1.5rem;
	max-width: 1.5rem;
	min-height: 1.5rem;
	max-height: 1.5rem;

	> p {
		font-size: 0.65rem;
	}
`;

const CustomShimmerAvatar = styled(Shimmer.Avatar)`
	min-width: 1.5rem;
	max-width: 1.5rem;
	min-height: 1.5rem;
	max-height: 1.5rem;
`;

const Presence = styled.div<{ $online: boolean }>`
	position: absolute;
	width: 0.4rem;
	height: 0.4rem;
	background-color: ${({ $online, theme }): string =>
		$online ? theme.palette.success.regular : theme.palette.gray2.regular};
	border: 0.0625rem solid ${(props): string => props.theme.palette.gray5.regular};
	border-radius: 50%;
	left: 1rem;
	bottom: 0;
`;

type UserPopoverRowProps = {
	userId: string;
	displayPresence?: boolean;
};

const UserPopoverRow = ({ userId, displayPresence }: UserPopoverRowProps): ReactElement => {
	const [t] = useTranslation();
	const youLabel = t('status.you', 'You');

	const username = useStore((store) => getUserName(store, userId));
	const isLoggedUser = useStore((store) => getIsLoggedUser(store, userId));
	const memberOnline: boolean = useStore((store) => getUserOnline(store, userId));
	const showUsersPresence = useStore((store) => getAttribute(store, 'showUsersPresence'));

	const { avatarColor, avatarPicture, avatarIcon, isLoading } = useAvatarUtilities(userId);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-start"
			gap="0.5rem"
			style={{ position: 'relative' }}
		>
			{isLoading ? (
				<CustomShimmerAvatar />
			) : (
				<CustomAvatar
					label={username}
					title={username}
					background={avatarColor}
					picture={avatarPicture}
					icon={avatarIcon}
				/>
			)}
			{showUsersPresence && displayPresence && <Presence $online={memberOnline} />}
			<Text size="small">{isLoggedUser ? youLabel : username}</Text>
		</Container>
	);
};

export default UserPopoverRow;
