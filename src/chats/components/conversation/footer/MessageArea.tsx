/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import React, { MutableRefObject, useCallback, useEffect } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

import { getInputHasFocus } from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';
import { SIZES } from '../../../../types/generics';

const MessageTextarea = styled.textarea<{ $composerIsFull: boolean }>`
	flex: 1;
	padding: 0.5rem 0 0.5rem 0.5rem;
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
	background: ${({ theme }): string => theme.palette.gray3.regular}
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

	${({ $composerIsFull }): false | ReturnType<typeof css> =>
		$composerIsFull &&
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
};

const MessageArea: React.FC<MessageAreaPros> = ({
	roomId,
	textareaRef,
	message,
	onInput,
	composerIsFull,
	handleKeyDownTextarea,
	handleKeyUpTextarea,
	handleOnPaste
}) => {
	const [t] = useTranslation();
	const messageComposerLabel = t('tooltip.messageComposer', 'Message composer');

	const inputHasFocus = useStore((store) => getInputHasFocus(store, roomId));
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	const initialFocus = useCallback(() => {
		textareaRef.current?.focus();
		// Place cursor at end of draft message
		if (useStore.getState().activeConversations[roomId]?.draftMessage) {
			const textArea = textareaRef.current;
			if (textArea) {
				textArea.setSelectionRange(textArea.value.length, textArea.value.length);
			}
		}
	}, [roomId, textareaRef]);

	useEffect(() => {
		initialFocus();
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		if (inputHasFocus) {
			textareaRef.current?.focus();
		}
	}, [inputHasFocus, textareaRef]);

	// Increase height when there are more lines
	useEffect(() => {
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

	const handleOnBlur = useCallback(() => {
		setInputHasFocus(roomId, false);
	}, [setInputHasFocus, roomId]);

	return (
		<MessageTextarea
			data-testid="textAreaComposer"
			ref={textareaRef}
			value={message}
			onKeyDown={handleKeyDownTextarea}
			onKeyUp={handleKeyUpTextarea}
			onChange={onInput}
			onFocus={handleOnFocus}
			onBlur={handleOnBlur}
			onPaste={handleOnPaste}
			aria-label={messageComposerLabel}
			$composerIsFull={composerIsFull}
		/>
	);
};

export default MessageArea;
