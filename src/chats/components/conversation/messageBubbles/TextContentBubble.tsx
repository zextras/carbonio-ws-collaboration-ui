/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { filter, join, size } from 'lodash';
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

const CustomText = styled(Text)<{ $isEmojiString: boolean }>`
	${({ $isEmojiString }): string | false => $isEmojiString && `font-size: 3rem;`}
`;

type TextContentBubbleProps = {
	textContent: string | (string | ReactElement)[];
};

const TextContentBubble: FC<TextContentBubbleProps> = ({ textContent }) => {
	const isEmojiString = useMemo(() => {
		const regexEmoji = /\p{Extended_Pictographic}/u;
		const text = join(textContent, '').replace(/\s+/g, '');
		const emojiMatches = filter([...text], (char) => regexEmoji.test(char));
		return size(emojiMatches) > 0 && size(emojiMatches) < 4 && size(text) === size(emojiMatches);
	}, [textContent]);

	return (
		<MessageText color="secondary" crossAlignment="flex-start">
			<MessageContent>
				<CustomText overflow="break-word" $isEmojiString={isEmojiString}>
					{textContent}
				</CustomText>
			</MessageContent>
		</MessageText>
	);
};

export default TextContentBubble;
