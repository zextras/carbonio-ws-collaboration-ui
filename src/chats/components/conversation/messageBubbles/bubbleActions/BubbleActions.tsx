/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement } from 'react';

import { Container, Theme } from '@zextras/carbonio-design-system';
import styled, { css, DefaultTheme, FlattenSimpleInterpolation } from 'styled-components';

import BubbleContextualMenuDropDown from './BubbleContextualMenuDropDown';
import BubbleReactions from './BubbleReactions';
import { Z_INDEX_RANK } from '../../../../../types/generics';
import { TextMessage } from '../../../../../types/store/MessageTypes';

const DropDownWrapper = styled(Container)`
	position: relative;
	z-index: ${Z_INDEX_RANK.DROPDOWN_CXT};
`;

export const BubbleActionsWrapper = styled.div<{
	children: ReactElement[];
	'data-testid': string;
	isMyMessage: boolean;
	theme?: DefaultTheme;
}>`
	position: absolute;
	display: flex;
	padding-top: 0.5rem;
	justify-content: flex-end;
	transition: 0.2s ease-out;
	opacity: 0;
	pointer-events: none;

	> div {
		pointer-events: auto;
	}

	${({
		theme,
		isMyMessage
	}: {
		theme: Theme;
		isMyMessage: boolean;
	}): FlattenSimpleInterpolation => css`
		top: -0.6875rem;
		right: -0.1875rem;
		width: 3rem;
		height: 1.6875rem;
		background-image: -webkit-radial-gradient(
			75% 50%,
			circle cover,
			${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
			transparent 100%
		);
		background-image: -moz-radial-gradient(
			75% 50%,
			circle cover,
			${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
			transparent 100
		);
		background-image: -o-radial-gradient(
			75% 50%,
			circle cover,
			${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
			transparent 100
		);
		background-image: -ms-radial-gradient(
			75% 50%,
			circle cover,
			${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
			transparent 100
		);
		background-image: radial-gradient(
			75% 50%,
			circle cover,
			${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
			transparent 100%
		);
		color: ${theme.palette.text.regular};
	`};
`;

type BubbleActionsProps = {
	message: TextMessage;
	isMyMessage: boolean;
};

const BubbleActions: FC<BubbleActionsProps> = ({ message, isMyMessage }) => (
	<DropDownWrapper padding={{ all: 'none' }}>
		<BubbleActionsWrapper data-testid={`cxtMenu-${message.id}-iconOpen`} isMyMessage={isMyMessage}>
			<BubbleReactions message={message} />
			<BubbleContextualMenuDropDown message={message} isMyMessage={isMyMessage} />
		</BubbleActionsWrapper>
	</DropDownWrapper>
);

export default BubbleActions;
