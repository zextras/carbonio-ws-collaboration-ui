/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { AttachmentListItem } from './AttachmentListItem';
import useStore from '../../../../store/Store';
import { createMockUser } from '../../../../tests/createMock';
import { screen, setup } from '../../../../tests/test-utils';
import type { Attachment } from '../../../../types/network/models/attachmentTypes';

const myUserId = 'me';
const otherUserId = 'other-user';
const ghostUserId = 'ghost-user';
const roomId = 'room-1';

const buildAttachment = (overrides?: Partial<Attachment>): Attachment => ({
	id: 'att-1',
	name: 'document.pdf',
	size: 2048,
	mimeType: 'application/pdf',
	userId: otherUserId,
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

beforeEach(() => {
	useStore.setState({ users: {} });
	useStore.getState().setLoginInfo({ id: myUserId, name: 'Me' });
	useStore
		.getState()
		.setUserInfo([createMockUser({ id: otherUserId, name: 'Matteo Perdon', email: 'mp@x.com' })]);
});

describe('AttachmentListItem', () => {
	test('renders the filename', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ name: 'report.pdf' })} />);
		expect(screen.getByText('report.pdf')).toBeInTheDocument();
	});

	test('renders the file-type icon based on mime type', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ id: 'att-icon' })} />);
		expect(screen.getByTestId('mediaGalleryAttachmentIcon-att-icon')).toBeInTheDocument();
	});

	test('shows the sender display name and formatted size when sender is a known user', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: otherUserId, size: 2048 })} />);
		expect(screen.getByText('Matteo Perdon • 2.00KB')).toBeInTheDocument();
	});

	test('shows "You" when the sender is the current session user', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: myUserId, size: 500 })} />);
		expect(screen.getByText('You • 500B')).toBeInTheDocument();
	});

	test('falls back to "Unknown user" when the sender cannot be resolved', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: ghostUserId, size: 2048 })} />);
		expect(screen.getByText('Unknown user • 2.00KB')).toBeInTheDocument();
	});

	test('omits the size separator when the size is zero', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: myUserId, size: 0 })} />);
		expect(screen.getByText('You')).toBeInTheDocument();
		expect(screen.queryByText(/•/)).not.toBeInTheDocument();
	});
});
