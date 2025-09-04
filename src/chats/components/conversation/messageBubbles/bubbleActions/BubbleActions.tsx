/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Container, Padding } from '@zextras/carbonio-design-system';

import useBubbleContextualMenuDropDown from './useBubbleContextualMenuDropDown';
import useBubbleReactions from './useBubbleReactions';
import { Z_INDEX_RANK } from '../../../../../types/generics';
import { TextMessage } from '../../../../../types/store/ChatsRegistryTypes';

const DropDownWrapper = styled(Container)`
	position: relative;
	z-index: ${Z_INDEX_RANK.DROPDOWN_CXT};
`;

export const BubbleActionsWrapper = styled.div<{
	$isMyMessage: boolean;
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

	${({ theme, $isMyMessage }): ReturnType<typeof css> => css`
		top: -0.6875rem;
		right: -0.1875rem;
		width: 3.1rem;
		height: 1.6875rem;
		background: ${theme.palette[$isMyMessage ? 'highlight' : 'gray6'].regular};
		border-bottom-left-radius: 20%;
		color: ${theme.palette.text.regular};
	`};

	${({ $isActive }): ReturnType<typeof css> | false =>
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

	const { ReactionsPopover, reactionsPopoverActive, reactionsPopoverRef } =
		useBubbleReactions(message);

	const closeDropdownOnScroll = useCallback(() => {
		menuDropdownActive && menuDropdownRef.current?.click();
		reactionsPopoverActive && reactionsPopoverRef.current?.click();
	}, [menuDropdownActive, menuDropdownRef, reactionsPopoverActive, reactionsPopoverRef]);

	useEffect(() => {
		const messageListRef = window.document.getElementById(`messageListRef${message.roomId}`);
		messageListRef?.addEventListener('scroll', closeDropdownOnScroll);
		return (): void => messageListRef?.removeEventListener('scroll', closeDropdownOnScroll);
	}, [closeDropdownOnScroll, message.roomId]);

	return (
		<DropDownWrapper padding={{ all: 0 }}>
			<BubbleActionsWrapper
				data-testid={`cxtMenu-${message.id}-iconOpen`}
				$isMyMessage={isMyMessage}
				$isActive={menuDropdownActive || reactionsPopoverActive}
			>
				<Padding left="0.25rem" />
				{ReactionsPopover}
				<Padding right="0.25rem" />
				{MenuDropdown}
			</BubbleActionsWrapper>
		</DropDownWrapper>
	);
};

export default BubbleActions;
