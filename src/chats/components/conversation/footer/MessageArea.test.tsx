/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import MessageArea from './MessageArea';
import useStore from '../../../../store/Store';
import { setup } from '../../../../tests/test-utils';

const roomId = 'roomId';
const messageText = "I'm a message";

const setupMessageArea = (): void => {
	setup(
		<MessageArea
			roomId={roomId}
			textareaRef={React.createRef<HTMLTextAreaElement>()}
			message={messageText}
			onInput={jest.fn()}
			composerIsFull={false}
			handleKeyDownTextarea={jest.fn()}
			handleOnBlur={jest.fn()}
			handleOnPaste={jest.fn}
			isDisabled={false}
		/>
	);
};
describe('MessageArea', () => {
	test('Set focus on textarea when MessageArea is mount', () => {
		setupMessageArea();
		const activeConversation = useStore.getState().activeConversations[roomId];
		expect(activeConversation.inputHasFocus).toBe(true);
		const textArea = screen.getByRole('textbox');
		expect(textArea).toHaveFocus();
	});

	test('Change focus when hasFocus information changes o store', () => {
		setupMessageArea();
		const textBox = screen.getByRole('textbox');
		textBox.blur();
		act(() => useStore.getState().setInputHasFocus(roomId, true));
		const textArea1 = screen.getByRole('textbox');
		expect(textArea1).not.toHaveFocus();
	});

	test('Focus on input when room changes', () => {
		const { rerender } = setup(
			<MessageArea
				roomId={roomId}
				textareaRef={React.createRef<HTMLTextAreaElement>()}
				message={messageText}
				onInput={jest.fn()}
				composerIsFull={false}
				handleKeyDownTextarea={jest.fn()}
				handleOnBlur={jest.fn()}
				handleOnPaste={jest.fn}
				isDisabled={false}
			/>
		);
		rerender(
			<MessageArea
				roomId="roomId1"
				textareaRef={React.createRef<HTMLTextAreaElement>()}
				message={messageText}
				onInput={jest.fn()}
				composerIsFull={false}
				handleKeyDownTextarea={jest.fn()}
				handleOnBlur={jest.fn()}
				handleOnPaste={jest.fn}
				isDisabled={false}
			/>
		);
		const textArea = screen.getByRole('textbox');
		expect(textArea).toHaveFocus();
	});

	test('Set selection position at the end of the text when input is focused', () => {
		setupMessageArea();
		const textArea = screen.getByRole('textbox');
		expect((textArea as HTMLTextAreaElement).selectionStart).toBe(messageText.length);
	});
});
