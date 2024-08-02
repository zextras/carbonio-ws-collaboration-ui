/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Avatar, Shimmer } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import useAvatarUtilities from '../../../hooks/useAvatarUtilities';
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

	const { avatarPicture, avatarIcon, avatarColor, isLoading } = useAvatarUtilities(userId ?? '');

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
