/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import MessageComposer from './MessageComposer';

describe('MessageComposer', () => {
	test('Open/close emoji picker by hovering it', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);

		// Initial state
		expect(screen.queryByTestId('emojiPicker')).not.toBeInTheDocument();

		// hover on emoji button
		const emojiButton = screen.getAllByRole('button')[0];
		await user.hover(emojiButton);
		expect(screen.getByTestId('emojiPicker')).toBeInTheDocument();

		// hover on emojiPicker
		const emojiPicker = screen.getByTestId('emojiPicker');
		await user.hover(emojiPicker);
		expect(screen.getByTestId('emojiPicker')).toBeInTheDocument();

		// hover on textarea for closing the emojiPicker
		const textArea = screen.getByRole('textbox');
		await user.hover(textArea);
		setTimeout(() => {
			expect(screen.queryByTestId('emojiPicker')).not.toBeInTheDocument();
		}, 1500);
	});

	test('Send message button status - initial status', () => {
		setup(<MessageComposer roomId={'roomId'} />);
		expect(screen.getByTestId('icon: Navigation2').parentNode).toBeDisabled();
	});

	test('Send message button status - spaces and text', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(screen.getByTestId('icon: Navigation2').parentNode).not.toBeDisabled();
	});

	test('Send message button status - only spaces', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, '     ');
		expect(screen.getByTestId('icon: Navigation2').parentNode).toBeDisabled();
	});

	test('Send a message', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		const sendButton = screen.getByTestId('icon: Navigation2');
		expect(sendButton).not.toBeDisabled();
		await user.click(sendButton);
		expect(textArea).toHaveValue('');
	});

	test('Select file button', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const selectFileButton = screen.getByTestId('icon: Attach');
		expect(selectFileButton).toBeVisible();

		// Button status while user writes
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(selectFileButton).toBeVisible();
	});
});
