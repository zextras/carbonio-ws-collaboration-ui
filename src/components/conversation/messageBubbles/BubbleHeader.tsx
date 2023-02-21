/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import styled from 'styled-components';

type BubbleHeaderProps = {
	senderIdentifier: string;
	notRepliedMessageHeader: boolean; // usefully to give more padding depending on type of message
	userColor: string;
};

const SenderText = styled(Text)`
	color: ${({ userColor, theme }): string[] => theme.avatarColors[userColor]};
`;

const BubbleHeader: FC<BubbleHeaderProps> = ({
	senderIdentifier,
	notRepliedMessageHeader,
	userColor
}) => (
	<>
		<Container crossAlignment="flex-start">
			<SenderText userColor={userColor} weight="bold" size="small">
				{senderIdentifier}
			</SenderText>
		</Container>
		{notRepliedMessageHeader && <Padding top="small" />}
	</>
);

export default BubbleHeader;
