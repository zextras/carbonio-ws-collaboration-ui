/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import styled, { DefaultTheme } from 'styled-components';

import GuestUserLabel from '../../../../meetings/components/GuestUserLabel';
import { getIsUserGuest, getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { calculateAvatarColor } from '../../../../utils/styleUtils';

type BubbleHeaderProps = {
	senderId: string;
};

const SenderText = styled(Text)<{ $userColor: keyof DefaultTheme['avatarColors'] }>`
	color: ${({ $userColor, theme }): string => theme.avatarColors[$userColor]};
`;

const BubbleHeader: FC<BubbleHeaderProps> = ({ senderId }) => {
	const senderName = useStore((store) => getUserName(store, senderId));
	const isUserGuest = useStore((store) => getIsUserGuest(store, senderId));

	const userColor = useMemo(() => calculateAvatarColor(senderName ?? ''), [senderName]);

	return (
		<Container orientation="horizontal" mainAlignment="flex-start" gap={'0.25rem'}>
			<SenderText $userColor={userColor} weight="bold">
				{senderName}
			</SenderText>
			{isUserGuest && <GuestUserLabel />}
		</Container>
	);
};

export default BubbleHeader;
