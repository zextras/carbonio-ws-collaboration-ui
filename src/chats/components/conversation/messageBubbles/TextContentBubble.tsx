/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, Text } from '@zextras/carbonio-design-system';
import { filter, size } from 'lodash';

import MarkdownMessage from './MarkdownMessage';

const MessageText = styled(Container)`
	white-space: pre-wrap;
	word-break: break-word;
`;

const CustomText = styled(Text)<{ $isEmojiString: boolean }>`
	${({ $isEmojiString }): string | false => $isEmojiString && `font-size: 3rem;`}
`;

type TextContentBubbleProps = {
	textContent: string;
};

const TextContentBubble: FC<TextContentBubbleProps> = ({ textContent }) => {
	const isEmojiString = useMemo(() => {
		const regexEmoji = /\p{Extended_Pictographic}/u;
		const text = textContent.replaceAll(/\s+/g, '');
		const emojiMatches = filter([...text], (char) => regexEmoji.test(char));
		return size(emojiMatches) > 0 && size(emojiMatches) < 4 && size(text) === size(emojiMatches);
	}, [textContent]);

	if (isEmojiString) {
		return (
			<MessageText color="secondary" crossAlignment="flex-start">
				<CustomText overflow="break-word" $isEmojiString>
					{textContent}
				</CustomText>
			</MessageText>
		);
	}

	return <MarkdownMessage text={textContent} />;
};

export default TextContentBubble;
