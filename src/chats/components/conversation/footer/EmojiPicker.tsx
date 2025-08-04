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
import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';
import { Picker } from 'emoji-mart';
import moment from 'moment-timezone';

import { MEETINGS_PATH } from '../../../../constants/appConstants';
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
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({
	onEmojiSelect,
	setShowEmojiPicker,
	emojiTimeoutRef
}) => {
	const pickerContainerRef = useRef<HTMLDivElement>(null);
	const pickerRef = useRef<Picker | null>(null);

	const isInsideMeeting = useMemo(() => window.location.pathname.includes(MEETINGS_PATH), []);

	const mouseEnterEvent = useCallback(() => {
		if (setShowEmojiPicker) {
			if (emojiTimeoutRef?.current) {
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
		if (pickerContainerRef.current) {
			pickerContainerRef.current.addEventListener('mouseenter', mouseEnterEvent);
			pickerContainerRef.current.addEventListener('mouseleave', mouseLeaveEvent);
			refValue = pickerContainerRef.current;
		}
		return (): void => {
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
		pickerRef.current = new Picker({
			previewPosition: 'none',
			onEmojiSelect,
			data,
			ref: pickerContainerRef,
			locale: moment.locale(),
			skinTonePosition: 'none'
		});
		return (): void => {
			pickerRef.current = null;
		};
	}, [onEmojiSelect]);

	return (
		<PickerWrapper
			ref={pickerContainerRef}
			data-testid="emojiPicker"
			height={`${scaleHeight}rem`}
			width="22rem"
			crossAlignment={'flex-start'}
		/>
	);
};

export default EmojiPicker;
