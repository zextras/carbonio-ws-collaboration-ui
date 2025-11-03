/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Avatar, Icon, Shimmer } from '@zextras/carbonio-design-system';

import useAvatarUtilities from '../../../hooks/useAvatarUtilities';
import {
	getIsLoggedUser,
	getIsLoggedUserExternal
} from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';

const StyledAvatar = styled(Avatar)`
	min-height: 3.125rem;
	min-width: 3.125rem;
	height: 49%;
	width: 27.5%;
	aspect-ratio: 1;
	max-height: 8.75rem;
	max-width: 8.75rem;
`;

const StyledShimmer = styled(Shimmer.Avatar)`
	min-height: 3.125rem;
	min-width: 3.125rem;
	height: 49%;
	width: 27.5%;
	aspect-ratio: 1;
	max-height: 8.75rem;
	max-width: 8.75rem;
`;

type tileAvatarComponentProps = {
	userId: string | undefined;
};

const TileAvatarComponent: FC<tileAvatarComponentProps> = ({ userId }) => {
	const userName = useStore((store) => getUserName(store, userId ?? ''));
	const isLoggedUser = useStore((store) => getIsLoggedUser(store, userId ?? ''));
	const isLoggedUserExternal = useStore(getIsLoggedUserExternal);

	const { avatarPicture, avatarIcon, avatarColor, isLoading } = useAvatarUtilities(userId ?? '');

	if (userId === undefined || (isLoggedUser && isLoggedUserExternal && userName === '')) {
		return <Icon icon="SmileOutline" color="gray6" style={{ width: '3rem', height: '3rem' }} />;
	}
	if (isLoading) {
		return <StyledShimmer />;
	}
	return (
		<StyledAvatar
			label={userName}
			title={userName}
			shape="round"
			size="extralarge"
			icon={avatarIcon}
			background={avatarColor}
			picture={avatarPicture}
		/>
	);
};

export default TileAvatarComponent;
