/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useEffect } from 'react';

import { Container, Padding, Theme } from '@zextras/carbonio-design-system';
import styled, { css, DefaultTheme, FlattenSimpleInterpolation } from 'styled-components';

import useBubbleContextualMenuDropDown from './useBubbleContextualMenuDropDown';
import useBubbleReactions from './useBubbleReactions';
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
	$isActive: boolean;
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
		width: 3.1rem;
		height: 1.6875rem;
		background: ${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular};
		border-bottom-left-radius: 20%;
		color: ${theme.palette.text.regular};
	`};

	${({ $isActive }): FlattenSimpleInterpolation | false =>
		$isActive &&
		css`
			opacity: 1;
		`};
`;

type BubbleActionsProps = {
	message: TextMessage;
	isMyMessage: boolean;
};

const BubbleActions: FC<BubbleActionsProps> = ({ message, isMyMessage }) => {
	const { MenuDropdown, menuDropdownActive, menuDropdownRef } = useBubbleContextualMenuDropDown(
		message,
		isMyMessage
	);

	const { ReactionsDropdown, reactionsDropdownActive, reactionsDropdownRef } =
		useBubbleReactions(message);

	const closeDropdownOnScroll = useCallback(() => {
		menuDropdownActive && menuDropdownRef.current?.click();
		reactionsDropdownActive && reactionsDropdownRef.current?.click();
	}, [menuDropdownActive, menuDropdownRef, reactionsDropdownActive, reactionsDropdownRef]);

	useEffect(() => {
		const messageListRef = window.document.getElementById(`messageListRef${message.roomId}`);
		messageListRef?.addEventListener('scroll', closeDropdownOnScroll);
		return (): void => messageListRef?.removeEventListener('scroll', closeDropdownOnScroll);
	}, [closeDropdownOnScroll, message.roomId]);

	return (
		<DropDownWrapper padding={{ all: 'none' }}>
			<BubbleActionsWrapper
				data-testid={`cxtMenu-${message.id}-iconOpen`}
				isMyMessage={isMyMessage}
				$isActive={menuDropdownActive || reactionsDropdownActive}
			>
				<Padding left="0.25rem" />
				{ReactionsDropdown}
				<Padding right="0.25rem" />
				{MenuDropdown}
			</BubbleActionsWrapper>
		</DropDownWrapper>
	);
};

export default BubbleActions;
