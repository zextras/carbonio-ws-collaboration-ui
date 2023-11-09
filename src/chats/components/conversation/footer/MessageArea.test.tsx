/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MessageArea from './MessageArea';
import { setup } from '../../../../tests/test-utils';

const roomId = 'roomId';
const defaultHeightMessageArea = 'height: 1.25rem';
const setupMessageArea = (text?: string): { rerender: (ui: React.ReactElement) => void } => {
	const { rerender } = setup(
		<MessageArea
			roomId={roomId}
			textareaRef={React.createRef<HTMLTextAreaElement>()}
			message={text || ''}
			onInput={jest.fn()}
			composerIsFull={false}
			handleKeyDownTextarea={jest.fn()}
			handleOnBlur={jest.fn()}
			handleOnPaste={jest.fn}
			isDisabled={false}
		/>
	);
	return { rerender };
};

describe('MessageArea - height', () => {
	test('Height with no text', () => {
		setupMessageArea();
		const textarea = screen.getByTestId('textAreaComposer');
		expect(textarea).toHaveStyle(defaultHeightMessageArea);
	});

	test('Height with two line of text', () => {
		const { rerender } = setupMessageArea();
		const textarea = screen.getByRole('textbox');
		jest.spyOn(textarea, 'scrollHeight', 'get').mockImplementation(() => 51);
		rerender(
			<MessageArea
				roomId="roomId1"
				textareaRef={React.createRef<HTMLTextAreaElement>()}
				message={'Test. \n Test.'}
				onInput={jest.fn()}
				composerIsFull={false}
				handleKeyDownTextarea={jest.fn()}
				handleOnBlur={jest.fn()}
				handleOnPaste={jest.fn}
				isDisabled={false}
			/>
		);
		expect(textarea).toHaveStyle('height: 35px');
	});

	test('Height after changing room: from empty textArea to empty textarea', () => {
		const { rerender } = setupMessageArea();
		const textarea = screen.getByTestId('textAreaComposer');
		rerender(
			<MessageArea
				roomId="new-roomId"
				textareaRef={React.createRef<HTMLTextAreaElement>()}
				message={''}
				onInput={jest.fn()}
				composerIsFull={false}
				handleKeyDownTextarea={jest.fn()}
				handleOnBlur={jest.fn()}
				handleOnPaste={jest.fn}
				isDisabled={false}
			/>
		);
		expect(textarea).toHaveStyle(defaultHeightMessageArea);
	});

	test('Height after changing room: from empty textArea to a short draft message', () => {
		const { rerender } = setupMessageArea();
		rerender(
			<MessageArea
				roomId="new-roomId"
				textareaRef={React.createRef<HTMLTextAreaElement>()}
				message="I'm a short draft message"
				onInput={jest.fn()}
				composerIsFull={false}
				handleKeyDownTextarea={jest.fn()}
				handleOnBlur={jest.fn()}
				handleOnPaste={jest.fn}
				isDisabled={false}
			/>
		);
		const textarea = screen.getByTestId('textAreaComposer');
		expect(textarea).toHaveStyle(defaultHeightMessageArea);
	});
});
