/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useMemo, useState } from 'react';

import { Avatar, Shimmer, useTheme } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { UsersApi } from '../../../network';
import { getUserName, getUserPictureUpdatedAt } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { calculateAvatarColor } from '../../../utils/styleUtils';

const StyledAvatar = styled(Avatar)`
	min-height: 3.125rem;
	min-width: 3.125rem;
	height: 49%;
	width: 27.5%;
	aspect-ratio: 1;
	max-height: 8.75rem;
	max-width: 8.75rem;
`;

const StyledShimmerAvatar = styled(Shimmer.Avatar)`
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
	const userName = useStore((store) => getUserName(store, userId || ''));
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, userId || '')
	);

	const [picture, setPicture] = useState<false | string>(false);

	const themeColor = useTheme();

	const userColor = useMemo(() => {
		const color = calculateAvatarColor(userName || '');
		return `${themeColor.avatarColors[color]}`;
	}, [userName, themeColor.avatarColors]);

	useEffect(() => {
		if (userPictureUpdatedAt != null) {
			setPicture(`${UsersApi.getURLUserPicture(userId || '')}?${userPictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [userId, userPictureUpdatedAt]);

	return userName ? (
		<StyledAvatar
			label={userName}
			title={userName}
			shape="round"
			size="extralarge"
			background={userColor}
			picture={picture || ''}
		/>
	) : (
		<StyledShimmerAvatar />
	);
};

export default TileAvatarComponent;
