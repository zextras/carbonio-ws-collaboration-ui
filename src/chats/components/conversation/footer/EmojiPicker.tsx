/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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
import styled from 'styled-components';

import { Emoji, Z_INDEX_RANK } from '../../../../types/generics';
import { calcScaleDivisor } from '../../../../utils/styleUtils';

const PickerWrapper = styled(Container)<{ $scaleHeight?: number }>`
	z-index: ${Z_INDEX_RANK.EMOJI_PICKER};
	position: absolute;
	bottom: 3.4375rem;
	left: 0.5rem;
	height: ${({ $scaleHeight }): string => `${$scaleHeight}rem`};
	width: 22rem;
	transform-origin: bottom left;
	animation: showEmoji 0.2s ease-in 0s 1;
	flex-wrap: wrap;

	// set height of emojiPicker when is small or large device
	@media (max-height: 48rem) {
		max-height: 18.125rem;
	}

	@keyframes showEmoji {
		0% {
			//transform: scale(0);
			opacity: 0;
		}
		100% {
			//transform: scale(1, 1);
			opacity: 1;
		}
	}
`;

type EmojiPickerProps = {
	onEmojiSelect: (emoji: Emoji) => void;
	setShowEmojiPicker?: Dispatch<SetStateAction<boolean>>;
	emojiTimeoutRef?: MutableRefObject<NodeJS.Timeout | undefined>;
	isInsideMeeting?: boolean;
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({
	onEmojiSelect,
	setShowEmojiPicker,
	emojiTimeoutRef,
	isInsideMeeting,
	...props
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
		return () => {
			if (refValue) {
				refValue.removeEventListener('mouseenter', mouseEnterEvent);
				refValue.removeEventListener('mouseleave', mouseLeaveEvent);
			}
		};
	}, [setShowEmojiPicker, emojiTimeoutRef, mouseEnterEvent, mouseLeaveEvent]);

	const scaleHeight = useMemo(
		() => (isInsideMeeting ? 290 / calcScaleDivisor() : 435 / calcScaleDivisor()),
		[isInsideMeeting]
	);

	useEffect(() => {
		// eslint-disable-next-line no-new
		new Picker({ previewPosition: 'none', ...props, onEmojiSelect, data, ref });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<PickerWrapper
			ref={ref}
			data-testid="emojiPicker"
			$scaleHeight={scaleHeight}
			mainAlignment={'flex-end'}
			crossAlignment={'flex-start'}
		/>
	);
};

export default EmojiPicker;
