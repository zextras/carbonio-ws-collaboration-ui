/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Container, Dropdown } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { getXmppClient } from '../../../../../store/selectors/ConnectionSelector';
import useStore from '../../../../../store/Store';
import { TextMessage } from '../../../../../types/store/MessageTypes';

type BubbleReactionsProps = {
	message: TextMessage;
};

const EmojiBox = styled(Container)<{
	$emoji: string;
}>`
	width: 2rem;
	height: 2rem;
	&::before {
		${({ $emoji }): string => `content: "${$emoji}";`};
	}
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.hover};
		cursor: pointer;
	}
`;

const BubbleReactions: FC<BubbleReactionsProps> = ({ message }) => {
	const xmppClient = useStore(getXmppClient);

	const [dropdownActive, setDropdownActive] = useState(false);

	const dropDownRef = useRef<HTMLDivElement>(null);

	const onDropdownOpen = useCallback(() => setDropdownActive(true), [setDropdownActive]);
	const onDropdownClose = useCallback(() => setDropdownActive(false), [setDropdownActive]);

	const closeDropdownOnScroll = useCallback(
		() => dropdownActive && dropDownRef.current?.click(),
		[dropdownActive]
	);

	useEffect(() => {
		const messageListRef = window.document.getElementById(`messageListRef${message.roomId}`);
		messageListRef?.addEventListener('scroll', closeDropdownOnScroll);
		return (): void => messageListRef?.removeEventListener('scroll', closeDropdownOnScroll);
	}, [closeDropdownOnScroll, message.roomId]);

	const sendReaction = useCallback(
		(emoji: string) => xmppClient.sendChatMessageReaction(message.roomId, message.stanzaId, emoji),
		[message.roomId, message.stanzaId, xmppClient]
	);

	const emojiItems = useMemo(
		() => [
			{
				id: 'emojis',
				disabled: true,
				customComponent: (
					<Container orientation="horizontal">
						<EmojiBox $emoji={'\uD83D\uDC4D'} onClick={() => sendReaction('\uD83D\uDC4D')} />
						<EmojiBox $emoji={'\u2764\uFE0F'} onClick={() => sendReaction('\u2764\uFE0F')} />
						<EmojiBox $emoji={'\uD83D\uDE02'} onClick={() => sendReaction('\uD83D\uDE02')} />
						<EmojiBox $emoji={'\uD83D\uDE22'} onClick={() => sendReaction('\uD83D\uDE22')} />
						<EmojiBox $emoji={'\uD83D\uDC4E'} onClick={() => sendReaction('\uD83D\uDC4E')} />
					</Container>
				),
				padding: '0'
			}
		],
		[sendReaction]
	);

	return (
		<Dropdown
			data-testid={`reactionsDropdown-${message.id}`}
			items={emojiItems}
			onOpen={onDropdownOpen}
			onClose={onDropdownClose}
			disableAutoFocus
			disableRestoreFocus
			disablePortal
			placement="top"
			ref={dropDownRef}
		>
			<Button
				icon="SmileOutline"
				type="ghost"
				size="small"
				color="text"
				onClick={(): null => null}
			/>
		</Dropdown>
	);
};

export default BubbleReactions;
