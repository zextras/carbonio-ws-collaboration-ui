/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import styled from '@emotion/styled';
import { Text } from '@zextras/carbonio-design-system';

interface HighlightedTextProps {
	text: string;
	searchText: string;
}

const CustomText = styled(Text)`
	white-space: pre-wrap;
	word-break: break-word;
`;

const HighlightedTextCustom = styled.span`
	color: ${({ theme }): string => theme.palette.primary.regular};
	font-weight: ${({ theme }): number => theme.fonts.weight.bold};
`;

const HighlightedText = ({ text, searchText }: HighlightedTextProps): React.JSX.Element => {
	const searchWords = searchText
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0);

	const escapedWords = searchWords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
	const parts = text.split(regex);

	return (
		<CustomText>
			{parts.map((part, i) =>
				part && searchWords.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
					<HighlightedTextCustom key={`${i}-${part}`}>{part}</HighlightedTextCustom>
				) : (
					part
				)
			)}
		</CustomText>
	);
};

export default HighlightedText;
