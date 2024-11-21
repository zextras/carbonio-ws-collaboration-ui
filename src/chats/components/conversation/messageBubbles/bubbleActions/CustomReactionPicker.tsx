/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useRef } from 'react';

import data from '@emoji-mart/data';
import { Container } from '@zextras/carbonio-design-system';
import { Picker } from 'emoji-mart';
import moment from 'moment-timezone';
import styled from 'styled-components';

import { Emoji, Z_INDEX_RANK } from '../../../../../types/generics';

const PickerWrapper = styled(Container)`
	z-index: ${Z_INDEX_RANK.EMOJI_PICKER};
	position: absolute;
	bottom: 2rem;
	left: -2.5rem;
	transform-origin: bottom left;
	animation: showEmoji 0.2s ease-in 0s 1;
	flex-wrap: wrap;

	// set height of emojiPicker when is small or large device
	@media (max-height: 48rem) {
		max-height: 18.125rem;
	}

	@keyframes showEmoji {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
`;

type EmojiPickerProps = {
	onEmojiSelect: (emoji: string) => void;
};

const CustomReactionPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
	const ref = useRef<HTMLDivElement>(null);

	const sendCustomReaction = useCallback(
		(emoji: Emoji) => onEmojiSelect(emoji.native),
		[onEmojiSelect]
	);

	useEffect(() => {
		// eslint-disable-next-line no-new
		new Picker({
			onEmojiSelect: sendCustomReaction,
			previewPosition: 'none',
			data,
			ref,
			locale: moment.locale(),
			perLine: 7
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <PickerWrapper ref={ref} data-testid="emojiPicker" height="15rem" width="15rem" />;
};

export default CustomReactionPicker;
