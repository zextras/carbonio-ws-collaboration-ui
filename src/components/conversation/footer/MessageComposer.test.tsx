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
	test('Open/close emoji picker', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);

		// Initial state
		expect(screen.queryByTestId('emojiPicker')).not.toBeInTheDocument();

		// Click on emoji button
		const emojiButton = screen.getAllByRole('button')[0];
		await user.click(emojiButton);
		expect(screen.getByTestId('emojiPicker')).toBeInTheDocument();

		// Close emojiPicker by clicking on emoji button
		await user.click(emojiButton);
		expect(screen.queryByTestId('emojiPicker')).not.toBeInTheDocument();
	});

	test('Send message button status - initial status', async () => {
		setup(<MessageComposer roomId={'roomId'} />);
		expect(screen.getAllByRole('button')[1]).toBeDisabled();
	});

	test('Send message button status - spaces and text', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, ' hi! ');
		expect(screen.getAllByRole('button')[1]).not.toBeDisabled();
	});

	test('Send message button status - only spaces', async () => {
		const { user } = setup(<MessageComposer roomId={'roomId'} />);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, '     ');
		expect(screen.getAllByRole('button')[1]).toBeDisabled();
	});
});
