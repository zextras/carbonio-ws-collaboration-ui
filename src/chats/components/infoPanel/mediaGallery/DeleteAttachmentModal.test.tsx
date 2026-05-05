/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { DeleteAttachmentModal } from './DeleteAttachmentModal';
import { screen, setup } from '../../../../tests/test-utils';

describe('DeleteAttachmentModal', () => {
	test('renders the title, description warning, and confirm label', () => {
		setup(<DeleteAttachmentModal open onConfirm={vi.fn()} onClose={vi.fn()} />);
		expect(screen.getByText('Delete attachment')).toBeInTheDocument();
		expect(
			screen.getByText(/the caption of the original message, if present, will also be deleted/i)
		).toBeInTheDocument();
		expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /yes, delete attachment/i })).toBeInTheDocument();
	});

	test('calls onConfirm when the confirm button is clicked', async () => {
		const onConfirm = vi.fn();
		const { user } = setup(<DeleteAttachmentModal open onConfirm={onConfirm} onClose={vi.fn()} />);
		await user.click(screen.getByRole('button', { name: /yes, delete attachment/i }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	test('renders the secondary "No, cancel" button and calls onClose when clicked', async () => {
		const onClose = vi.fn();
		const { user } = setup(<DeleteAttachmentModal open onConfirm={vi.fn()} onClose={onClose} />);
		const cancelButton = screen.getByRole('button', { name: /no, cancel/i });
		expect(cancelButton).toBeInTheDocument();
		await user.click(cancelButton);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	test('does not render content when open is false', () => {
		setup(<DeleteAttachmentModal open={false} onConfirm={vi.fn()} onClose={vi.fn()} />);
		expect(screen.queryByText('Delete attachment')).not.toBeInTheDocument();
	});
});
