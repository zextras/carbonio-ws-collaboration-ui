/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useRef, useState } from 'react';

import { Button, Container, Dropdown } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import styled from 'styled-components';

import { getXmppClient } from '../../../../../store/selectors/ConnectionSelector';
import { getMyLastReaction } from '../../../../../store/selectors/FasteningsSelectors';
import useStore from '../../../../../store/Store';
import { TextMessage } from '../../../../../types/store/MessageTypes';

export enum ReactionType {
	'THUMBS_UP' = '\uD83D\uDC4D',
	'HEART' = '\u2764\uFE0F',
	'JOY' = '\uD83D\uDE02',
	'CRY' = '\uD83D\uDE22',
	'THUMBS_DOWN' = '\uD83D\uDC4E'
}

const EmojiBox = styled(Container)<{
	$emoji: string;
	$selected: boolean;
}>`
	width: 2rem;
	height: 2rem;
	&::before {
		${({ $emoji }): string => `content: "${$emoji}";`};
	}
	&:hover {
		background-color: ${({ theme, $selected }): string =>
			$selected ? theme.palette.highlight.active : theme.palette.gray6.hover};
		cursor: pointer;
	}

	${({ theme, $selected }): string | false =>
		$selected && `background-color: ${theme.palette.highlight.focus};`};
`;

const useBubbleReactions = (
	message: TextMessage
): {
	ReactionsDropdown: ReactElement;
	reactionsDropdownActive: boolean;
	reactionsDropdownRef: React.RefObject<HTMLDivElement>;
} => {
	const xmppClient = useStore(getXmppClient);

	const myReaction = useStore((store) =>
		getMyLastReaction(store, message.roomId, message.stanzaId)
	);

	const [dropdownActive, setDropdownActive] = useState(false);

	const dropDownRef = useRef<HTMLDivElement>(null);

	const onDropdownOpen = useCallback(() => setDropdownActive(true), [setDropdownActive]);
	const onDropdownClose = useCallback(() => setDropdownActive(false), [setDropdownActive]);

	const sendReaction = useCallback(
		(emoji: string) => {
			if (myReaction !== emoji) {
				xmppClient.sendChatMessageReaction(message.roomId, message.stanzaId, emoji);
			} else {
				xmppClient.sendChatMessageReaction(message.roomId, message.stanzaId, '');
			}
		},
		[message.roomId, message.stanzaId, myReaction, xmppClient]
	);

	const emojiItems = useMemo(
		() => [
			{
				id: 'emojis',
				customComponent: (
					<Container orientation="horizontal">
						{map(ReactionType, (emoji) => (
							<EmojiBox
								background="gray6"
								key={emoji}
								data-testid={`reaction-${emoji}`}
								$emoji={emoji}
								$selected={myReaction === emoji}
								onClick={() => sendReaction(emoji)}
							/>
						))}
					</Container>
				),
				padding: '0'
			}
		],
		[myReaction, sendReaction]
	);

	const ReactionsDropdown = useMemo(
		() => (
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
		),
		[emojiItems, dropDownRef, message.id, onDropdownClose, onDropdownOpen]
	);
	return {
		ReactionsDropdown,
		reactionsDropdownActive: dropdownActive,
		reactionsDropdownRef: dropDownRef
	};
};

export default useBubbleReactions;
