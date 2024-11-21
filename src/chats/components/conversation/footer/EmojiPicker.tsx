/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	MutableRefObject,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef
} from 'react';

import data from '@emoji-mart/data';
import { Container } from '@zextras/carbonio-design-system';
import { Picker } from 'emoji-mart';
import moment from 'moment-timezone';
import styled from 'styled-components';

import { Emoji, Z_INDEX_RANK } from '../../../../types/generics';
import { calcScaleDivisor } from '../../../../utils/styleUtils';

const PickerWrapper = styled(Container)`
	z-index: ${Z_INDEX_RANK.EMOJI_PICKER};
	position: absolute;
	bottom: 3.75rem;
	left: 0.5rem;
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
	onEmojiSelect: (emoji: Emoji) => void;
	setShowEmojiPicker: Dispatch<SetStateAction<boolean>>;
	emojiTimeoutRef?: MutableRefObject<NodeJS.Timeout | undefined>;
	smallSize?: boolean;
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({
	onEmojiSelect,
	setShowEmojiPicker,
	emojiTimeoutRef,
	smallSize = false
}) => {
	const ref = useRef<HTMLDivElement>(null);

	const mouseEnterEvent = useCallback(() => {
		if (setShowEmojiPicker) {
			if (emojiTimeoutRef && emojiTimeoutRef.current) {
				clearTimeout(emojiTimeoutRef.current);
			}
			setShowEmojiPicker(true);
		}
	}, [emojiTimeoutRef, setShowEmojiPicker]);

	const mouseLeaveEvent = useCallback(() => {
		setTimeout(() => {
			if (setShowEmojiPicker) {
				setShowEmojiPicker(false);
			}
		}, 300);
	}, [setShowEmojiPicker]);

	useEffect(() => {
		let refValue: HTMLDivElement | null = null;
		if (ref.current) {
			ref.current.addEventListener('mouseenter', mouseEnterEvent);
			ref.current.addEventListener('mouseleave', mouseLeaveEvent);
			refValue = ref.current;
		}
		return (): void => {
			if (refValue) {
				refValue.removeEventListener('mouseenter', mouseEnterEvent);
				refValue.removeEventListener('mouseleave', mouseLeaveEvent);
			}
		};
	}, [setShowEmojiPicker, emojiTimeoutRef, mouseEnterEvent, mouseLeaveEvent]);

	const scaleHeight = useMemo(
		() => (smallSize ? 290 / calcScaleDivisor() : 435 / calcScaleDivisor()),
		[smallSize]
	);

	useEffect(() => {
		// eslint-disable-next-line no-new
		new Picker({ previewPosition: 'none', onEmojiSelect, data, ref, locale: moment.locale() });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<PickerWrapper
			ref={ref}
			data-testid="emojiPicker"
			height={`${scaleHeight}rem`}
			width="22rem"
			crossAlignment={'flex-start'}
		/>
	);
};

export default EmojiPicker;
