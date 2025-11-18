/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Popover, Tooltip } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import CustomReactionPicker from './CustomReactionPicker';
import { getMyLastReaction } from '../../../../../store/selectors/ChatsRegistrySelectors';
import { getXmppClient } from '../../../../../store/selectors/ConnectionSelector';
import useStore from '../../../../../store/Store';
import { TextMessage } from '../../../../../types/store/ChatsRegistryTypes';

export enum ReactionType {
	'THUMBS_UP' = '\uD83D\uDC4D',
	'HEART' = '\u2764\uFE0F',
	'JOY' = '\uD83D\uDE02',
	'CRY' = '\uD83D\uDE22',
	'THUMBS_DOWN' = '\uD83D\uDC4E'
}

const CustomPopover = styled(Popover)`
	> div > div {
		padding: 0;
	}
`;

const EmojiButton = styled(Button)<{ $selected?: boolean }>`
	width: 2rem;
	height: 2rem;
	padding: 0;
	&:hover {
		background-color: ${({ theme, $selected }): string =>
			$selected ? theme.palette.highlight.active : theme.palette.gray6.hover};
		cursor: pointer;
	}
	${({ theme, $selected }): string | false =>
		!!$selected && `background-color: ${theme.palette.highlight.focus};`};
`;

const useBubbleReactions = (
	message: TextMessage
): {
	ReactionsPopover: ReactElement;
	reactionsPopoverActive: boolean;
	reactionsPopoverRef: React.RefObject<HTMLDivElement>;
} => {
	const xmppClient = useStore(getXmppClient);
	const [t] = useTranslation();
	const reactionsLabel = t('tooltip.reactions', 'Reactions');
	const moreReactionsLabel = t('tooltip.moreReactions', 'More reactions');

	const myReaction = useStore((store) =>
		getMyLastReaction(store, message.roomId, message.stanzaId)
	);
	const buttonRef = useRef<HTMLDivElement>(null);

	const [popoverActive, setPopoverActive] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const onPopoverOpen = useCallback(() => setPopoverActive(true), [setPopoverActive]);
	const onPopoverClose = useCallback(() => {
		setShowEmojiPicker(false);
		setPopoverActive(false);
	}, [setPopoverActive]);

	const sendReaction = useCallback(
		(emoji: string) => {
			if (myReaction !== emoji) {
				xmppClient.sendChatMessageReaction(message.roomId, message.stanzaId, emoji);
			} else {
				xmppClient.sendChatMessageReaction(message.roomId, message.stanzaId, '');
			}
			setPopoverActive(false);
		},
		[message.roomId, message.stanzaId, myReaction, xmppClient]
	);

	const openEmojiPicker = useCallback(
		(ev: React.MouseEvent | KeyboardEvent) => {
			ev.stopPropagation();
			setShowEmojiPicker(true);
		},
		[setShowEmojiPicker]
	);

	const selectCustomReaction = useCallback(
		(emoji: string) => {
			sendReaction(emoji);
			setShowEmojiPicker(false);
		},
		[sendReaction]
	);

	const popoverContent = useMemo(() => {
		if (showEmojiPicker) return <CustomReactionPicker onEmojiSelect={selectCustomReaction} />;
		return (
			<>
				{map(ReactionType, (emoji) => (
					<EmojiButton
						key={emoji}
						data-testid={`reaction-${emoji}`}
						label={emoji}
						backgroundColor="gray6"
						onClick={() => sendReaction(emoji)}
						$selected={myReaction === emoji}
					/>
				))}
				<Tooltip label={moreReactionsLabel} placement="top">
					<EmojiButton
						key="custom-reactions"
						data-testid="custom-reactions"
						icon="Plus"
						backgroundColor="gray6"
						labelColor="text"
						onClick={openEmojiPicker}
					/>
				</Tooltip>
			</>
		);
	}, [
		moreReactionsLabel,
		myReaction,
		openEmojiPicker,
		selectCustomReaction,
		sendReaction,
		showEmojiPicker
	]);

	const ReactionsPopover = useMemo(
		() => (
			<Tooltip label={reactionsLabel} placement="left">
				<Container width="fit" height="fit">
					<Button
						ref={buttonRef}
						icon="SmileOutline"
						type="ghost"
						size="small"
						color="text"
						onClick={onPopoverOpen}
					/>
					<CustomPopover
						open={popoverActive}
						anchorEl={buttonRef}
						placement="top"
						onClose={onPopoverClose}
						styleAsModal
					>
						<Container orientation="horizontal">{popoverContent}</Container>
					</CustomPopover>
				</Container>
			</Tooltip>
		),
		[reactionsLabel, onPopoverOpen, popoverActive, onPopoverClose, popoverContent]
	);

	return {
		ReactionsPopover,
		reactionsPopoverActive: popoverActive,
		reactionsPopoverRef: buttonRef
	};
};

export default useBubbleReactions;
