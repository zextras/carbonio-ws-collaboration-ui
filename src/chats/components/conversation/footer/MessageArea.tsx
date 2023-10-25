/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { MutableRefObject, useCallback, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import styled, { css, FlattenSimpleInterpolation } from 'styled-components';

import { getInputHasFocus } from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';
import { SIZES } from '../../../../types/generics';

const MessageTextarea = styled.textarea`
	box-sizing: border-box;
	font-family: 'Segoe UI', 'Lucida Sans', sans-serif;
	font-size: ${({ theme }): string => theme.sizes.font.medium};
	resize: none;
	-webkit-user-select: text;
	cursor: auto;
	height: 2.875rem;
	min-height: 2.875rem;
	padding-top: 0.9375rem;
	border: none;
	vertical-align: text-top;
	overflow-y: scroll;
	max-height: calc(50vh - ${SIZES.SPACE_FOR_ELEMENTS_VISIBLE_ON_MESSAGE_LIST});
	width: 100%;
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
	handleOnBlur: (e: never) => void;
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
	handleOnBlur,
	handleOnPaste,
	isDisabled
}) => {
	const [t] = useTranslation();
	const messageComposerLabel = t('tooltip.messageComposer', 'Message composer');

	const inputHasFocus = useStore((store) => getInputHasFocus(store, roomId));
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	useEffect(() => {
		if (inputHasFocus) {
			textareaRef.current?.focus();
			// Focus the end of the input if there is a draft message
			textareaRef.current?.setSelectionRange(message.length, message.length);
		}
	}, [inputHasFocus, message.length, textareaRef]);

	const handleOnFocus = useCallback(
		() => setInputHasFocus(roomId, true),
		[roomId, setInputHasFocus]
	);

	return (
		<MessageTextarea
			data-testid="textAreaComposer"
			ref={textareaRef}
			value={message}
			onKeyDown={handleKeyDownTextarea}
			onChange={onInput}
			onFocus={handleOnFocus}
			onBlur={handleOnBlur}
			onPaste={handleOnPaste}
			aria-label={messageComposerLabel}
			composerIsFull={composerIsFull}
			disabled={isDisabled}
		/>
	);
};

export default MessageArea;
