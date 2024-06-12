/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';

import useAvatarUtilities from '../../../../hooks/useAvatarUtilities';
import GuestUserLabel from '../../../../meetings/components/GuestUserLabel';
import { getIsUserGuest, getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';

type BubbleHeaderProps = {
	senderId: string;
};

const BubbleHeader: FC<BubbleHeaderProps> = ({ senderId }) => {
	const senderName = useStore((store) => getUserName(store, senderId));
	const isUserGuest = useStore((store) => getIsUserGuest(store, senderId));

	const { avatarColor } = useAvatarUtilities(senderId);

	return (
		<Container orientation="horizontal" mainAlignment="flex-start" gap={'0.25rem'}>
			<Text color={avatarColor} weight="bold">
				{senderName}
			</Text>
			{isUserGuest && <GuestUserLabel />}
		</Container>
	);
};

export default BubbleHeader;
