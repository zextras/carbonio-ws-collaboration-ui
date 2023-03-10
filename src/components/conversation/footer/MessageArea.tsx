/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css, FlattenSimpleInterpolation } from 'styled-components';

const MessageTextarea = styled.textarea`
	box-sizing: border-box;
	font-family: 'Segoe UI', 'Lucida Sans', sans-serif;
	font-size: ${({ theme }): string => theme.sizes.font.medium};
	resize: none;
	-webkit-user-select: text;
	cursor: auto;
	height: 2.875rem;
	min-height: 2.875rem;
	padding-top: 0.75rem;
	border: none;
	vertical-align: text-top;
	overflow-y: scroll;
	max-height: calc(50vh - 6.25rem);
	width: 100%;

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
		background: ${({ theme }): string => theme.palette.gray6.active};
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
	textareaRef: Ref<HTMLTextAreaElement>;
	message: string;
	onInput: (e: never) => void;
	composerIsFull: boolean;
	handleKeyDownTextarea: (e: never) => void;
	handleOnBlur: (e: never) => void;
	handleOnFocus: (e: never) => void;
};

const MessageArea: React.FC<MessageAreaPros> = ({
	textareaRef,
	message,
	onInput,
	composerIsFull,
	handleKeyDownTextarea,
	handleOnBlur,
	handleOnFocus
}) => {
	const [t] = useTranslation();
	const messageComposerLabel = t('tooltip.messageComposer', 'Message composer');
	// TODO handle onpaste for images and text

	return (
		<MessageTextarea
			ref={textareaRef}
			value={message}
			onKeyDown={handleKeyDownTextarea}
			onChange={onInput}
			onFocus={handleOnFocus}
			onBlur={handleOnBlur}
			// onPaste={handleOnPaste}
			aria-label={messageComposerLabel}
			composerIsFull={composerIsFull}
		/>
	);
};

export default MessageArea;
