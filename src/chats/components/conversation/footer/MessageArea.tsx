/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import React, { MutableRefObject, useCallback, useEffect } from 'react';

import { Button } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled, { css, FlattenSimpleInterpolation } from 'styled-components';

import { getInputHasFocus } from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';
import { SIZES } from '../../../../types/generics';
import useFirstUnreadMessage from '../useFirstUnreadMessage';

const MessageTextarea = styled.div<{
	contentEditable: boolean;
	onInput: (e: never) => void;
	ref: MutableRefObject<HTMLTextAreaElement | null>;
	// value: string;
	onKeyDown: (e: never) => void;
	onKeyUp: (e: never) => void;
	// onChange: (e: never) => void;
	onFocus: (e: never) => void;
	onBlur: (e: never) => void;
	onPaste: (e: never) => void;
	composerIsFull: boolean;
	disabled: boolean;
}>`
	flex: 1;
	padding: 0.5rem 0;
	height: 1.25rem;
	min-height: 1.25rem;
	max-height: calc(50vh - ${SIZES.SPACE_FOR_ELEMENTS_VISIBLE_ON_MESSAGE_LIST});
	line-height: 1.1;
	font-family: 'Segoe UI', 'Lucida Sans', sans-serif;
	font-size: ${({ theme }): string => theme.sizes.font.medium};
	resize: none;
	-webkit-user-select: text;
	cursor: auto;
	border: none;
	overflow-y: scroll;
	scrollbar-color: ${({ theme }): string => theme.palette.gray3.regular} transparent;

	@keyframes inputFull {
		0% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.5;
		}
	}

	${({ composerIsFull }: { composerIsFull: boolean }): false | FlattenSimpleInterpolation =>
		composerIsFull &&
		css`
			opacity: 0.5 !important;
			animation: inputFull 0.1s ease-in 0s 1;
			&:hover,
			&:active,
			&:focus,
			&:visited {
				opacity: 0.5 !important;
			}
		`};

	&::-webkit-scrollbar {
		width: 0.5rem;
		height: 0.5rem;
	}
	&::-webkit-scrollbar-thumb {
		background: ${({ theme }): string => theme.palette.gray3.regular};
		border-radius: 0.25rem;
	}
	&::-webkit-scrollbar-thumb:hover {
		background: #ccc;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
	&:focus,
	&:active {
		outline: none;
	}
`;

type MessageAreaPros = {
	roomId: string;
	textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
	message: string;
	onInput: (e: never) => void;
	composerIsFull: boolean;
	handleKeyDownTextarea: (e: never) => void;
	handleKeyUpTextarea: (e: never) => void;
	handleOnPaste: (e: never) => void;
	isDisabled: boolean;
};

const MessageArea: React.FC<MessageAreaPros> = ({
	roomId,
	textareaRef,
	message,
	onInput,
	composerIsFull,
	handleKeyDownTextarea,
	handleKeyUpTextarea,
	handleOnPaste,
	isDisabled
}) => {
	const [t] = useTranslation();
	const messageComposerLabel = t('tooltip.messageComposer', 'Message composer');

	const inputHasFocus = useStore((store) => getInputHasFocus(store, roomId));
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const setDraftMessage = useStore((store) => store.setDraftMessage);

	const firstNewMessage = useFirstUnreadMessage(roomId);

	// Focus input when roomId changes: but if there are unread messages wait to calculate the first unread message
	useEffect(() => {
		if (
			!useStore.getState().unreads[roomId] ||
			useStore.getState().unreads[roomId] === 0 ||
			firstNewMessage
		) {
			textareaRef.current?.focus();
		}
	}, [firstNewMessage, roomId, textareaRef]);

	useEffect(() => {
		// TODO: IT NOT WORKS!
		if (inputHasFocus) {
			textareaRef.current?.focus();
			// Focus the end of the input if there is a draft message;
			if (textareaRef.current) {
				const textAreaValue = textareaRef.current.value;
				textareaRef.current.value = '';
				textareaRef.current.value = textAreaValue;
			}
		}
	}, [inputHasFocus, textareaRef]);

	// Increase height when there are more lines
	useEffect(() => {
		// IT WORKS!
		if (textareaRef.current) {
			textareaRef.current.style.height = '';
			if (textareaRef.current.scrollHeight > textareaRef.current.clientHeight) {
				textareaRef.current.style.height = `${textareaRef.current.scrollHeight - 16}px`;
			} else {
				textareaRef.current.style.height = '1.25rem';
			}
		}
	}, [message, textareaRef]);

	const handleOnFocus = useCallback(
		() => setInputHasFocus(roomId, true),
		[roomId, setInputHasFocus]
	);

	// Moved from MessageComposer
	const handleOnBlur = useCallback(() => {
		if (size(message) > 0) {
			setDraftMessage(roomId, false, message);
		} else {
			setDraftMessage(roomId, true);
		}
		setInputHasFocus(roomId, false);
	}, [message, setInputHasFocus, roomId, setDraftMessage]);

	// Update the innerHTML of the textarea
	useEffect(() => {
		if (textareaRef.current && textareaRef.current.innerHTML !== message) {
			textareaRef.current.innerHTML = message;
		}
	}, [message, textareaRef]);

	const addChip = useCallback(() => {
		if (textareaRef.current) {
			const squareDiv = document.createElement('div');
			squareDiv.style.width = '20px';
			squareDiv.style.height = '20px';
			squareDiv.style.backgroundColor = 'blue';
			squareDiv.style.display = 'inline-block'; // Per tenerlo in linea con il testo
			squareDiv.contentEditable = 'false';

			textareaRef.current.appendChild(squareDiv);

			// Assicurati che il cursore si sposti dopo il div aggiunto
			const range = document.createRange();
			range.setStartAfter(squareDiv);
			range.collapse(true);

			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);

			textareaRef.current.focus();
		}
	}, [textareaRef]);

	return (
		<>
			<MessageTextarea
				data-testid="textAreaComposer"
				ref={textareaRef}
				contentEditable
				onInput={onInput}
				// value={message} REPLACED with innerHTML useEffect
				onKeyDown={handleKeyDownTextarea}
				onKeyUp={handleKeyUpTextarea}
				// onChange={onInput} REPLACED with onInput
				onFocus={handleOnFocus}
				onBlur={handleOnBlur}
				onPaste={handleOnPaste}
				aria-label={messageComposerLabel}
				composerIsFull={composerIsFull}
				disabled={isDisabled}
			/>
			<Button icon="Star" onClick={addChip} />
		</>
	);
};

export default MessageArea;
