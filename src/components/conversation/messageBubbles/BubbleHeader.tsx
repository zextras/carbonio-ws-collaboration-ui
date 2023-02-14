/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';

import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { calculateAvatarColor } from '../../../utils/styleUtils';

type BubbleHeaderProps = {
	senderId: string;
	notReplayedMessageHeader: boolean; // usefully to give more padding depending on type of message
};

const SenderText = styled(Text)`
	color: ${({ userColor, theme }): string[] => theme.avatarColors[userColor]};
`;

const BubbleHeader: FC<BubbleHeaderProps> = ({ senderId, notReplayedMessageHeader }) => {
	const senderName = useStore((store) => getUserName(store, senderId));

	const userColor = useMemo(() => calculateAvatarColor(senderName || ''), [senderName]);

	return (
		<>
			<Container crossAlignment="flex-start">
				<SenderText userColor={userColor} weight="bold" size="small">
					{senderName}
				</SenderText>
			</Container>
			{notReplayedMessageHeader && <Padding top="small" />}
		</>
	);
};

export default BubbleHeader;
