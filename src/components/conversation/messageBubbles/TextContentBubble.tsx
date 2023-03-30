/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { FC, ReactElement } from 'react';
import styled from 'styled-components';

const MessageText = styled(Container)`
	white-space: pre-wrap;
	word-break: break-word;
`;

const MessageContent = styled.span`
	user-select: text;
	vertical-align: middle;
	a {
		color: ${({ theme }): string => theme.palette.info.regular};
		text-decoration: underline;
		&:hover {
			color: ${({ theme }): string => theme.palette.info.hover};
		}
		&:focus {
			color: ${({ theme }): string => theme.palette.info.focus};
		}
		&:active {
			color: ${({ theme }): string => theme.palette.info.active};
		}
	}
`;

type TextContentBubbleProps = {
	textContent: string | (string | ReactElement)[];
};

const TextContentBubble: FC<TextContentBubbleProps> = ({ textContent }) => (
	<MessageText color="secondary" size="small" crossAlignment="flex-start">
		<MessageContent>
			<Text overflow="break-word">{textContent}</Text>
		</MessageContent>
	</MessageText>
);

export default TextContentBubble;
