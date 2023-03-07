/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type WritingBubbleProps = {
	writingListNames: string[];
};

const BubbleWritingContainer = styled(Container)`
	@keyframes showBubble {
		0% {
			transform: translateX(-3.125rem);
			opacity: 0;
		}
		100% {
			transform: translateX(0);
			opacity: 1;
		}
	}
	margin-top: 0.25rem;
	margin-bottom: 0.25rem;
	box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);
	border-radius: 0.25rem 0.25rem 0.25rem 0;
	animation: showBubble 0.2s ease-in 0s forwards;
`;

const CustomText = styled(Text)`
	font-style: italic;
	padding-right: 0.1875rem;
`;

// TODO ADD TEST

const WritingBubble: FC<WritingBubbleProps> = ({ writingListNames }) => {
	const [t] = useTranslation();
	const isWritingLabel = t('status.isTyping', 'is typing...');
	const areWritingLabel = t('status.areTyping', 'are typing...');
	const writingUsersLabel =
		// eslint-disable-next-line no-nested-ternary
		writingListNames.length > 0
			? writingListNames.length === 1
				? `${writingListNames.toString()} ${isWritingLabel}`
				: `${writingListNames.join(', ')} ${areWritingLabel}`
			: null;

	return writingListNames.length > 0 ? (
		<BubbleWritingContainer
			key="isWritingBubble"
			height="fit"
			width="fit"
			padding={{ all: 'medium' }}
			background={'gray6'}
		>
			<CustomText color="secondary" size="medium">
				{writingUsersLabel}
			</CustomText>
		</BubbleWritingContainer>
	) : null;
};

export default WritingBubble;
