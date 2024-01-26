/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import EmojiPicker from './EmojiPicker';
import { MEETINGS_PATH } from '../../../../constants/appConstants';
import { Emoji } from '../../../../types/generics';

const EmojiIconButton = styled(IconButton)<{ alt?: string }>``;

type EmojiSelectorProps = {
	messageInputRef: React.RefObject<HTMLTextAreaElement>;
	setMessage: (text: string) => void;
};
const EmojiSelector: React.FC<EmojiSelectorProps> = ({ messageInputRef, setMessage }) => {
	const [t] = useTranslation();
	const selectEmojiLabel = t('tooltip.selectEmoji', 'Select emoji');

	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const emojiButtonRef = useRef<HTMLDivElement>(null);
	const emojiTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

	const isInsideMeeting = useMemo(() => window.location.pathname.includes(MEETINGS_PATH), []);

	const mouseEnterEvent = useCallback(() => {
		if (emojiButtonRef.current) {
			clearTimeout(emojiTimeoutRef.current);
			setShowEmojiPicker(true);
		}
	}, []);

	const mouseLeaveEvent = useCallback(() => {
		if (emojiButtonRef.current) {
			emojiTimeoutRef.current = setTimeout(() => {
				setShowEmojiPicker(false);
			}, 300);
		}
	}, []);

	useEffect(() => {
		let refValue: HTMLDivElement;
		if (emojiButtonRef.current) {
			emojiButtonRef.current.addEventListener('mouseenter', mouseEnterEvent);
			emojiButtonRef.current.addEventListener('mouseleave', mouseLeaveEvent);
			refValue = emojiButtonRef.current;
		}
		return () => {
			if (refValue) {
				refValue.removeEventListener('mouseenter', mouseEnterEvent);
				refValue.removeEventListener('mouseleave', mouseLeaveEvent);
			}
		};
	}, [mouseEnterEvent, mouseLeaveEvent]);

	const insertEmojiInMessage = useCallback(
		(emoji: Emoji): void => {
			if (messageInputRef.current) {
				const position = messageInputRef.current.selectionStart;
				const prevPosition = messageInputRef.current.value.slice(0, position);
				const nextPosition = messageInputRef.current.value.slice(position);
				const text = `${prevPosition}${emoji.native}${nextPosition}`;
				setMessage(text);
				const cursorMiddlePosition = emoji.native.length + position;
				messageInputRef.current.focus();
				messageInputRef.current.setSelectionRange(cursorMiddlePosition, cursorMiddlePosition);
			}
		},
		[setMessage, messageInputRef]
	);

	return (
		<>
			{showEmojiPicker && (
				<EmojiPicker
					onEmojiSelect={insertEmojiInMessage}
					setShowEmojiPicker={setShowEmojiPicker}
					emojiTimeoutRef={emojiTimeoutRef}
					isInsideMeeting={isInsideMeeting}
				/>
			)}
			<Tooltip label={selectEmojiLabel}>
				<Container width="fit" height="fit">
					<EmojiIconButton
						ref={emojiButtonRef}
						iconColor="secondary"
						size="large"
						icon="SmileOutline"
						alt={selectEmojiLabel}
						onClick={(): null => null}
					/>
				</Container>
			</Tooltip>
		</>
	);
};

export default EmojiSelector;
