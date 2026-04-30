/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor } from '@testing-library/react';

import { MediaGalleryTab } from './MediaGalleryTab';
import { getRoomAttachments } from '../../../../network';
import { screen, setup, triggerObserver } from '../../../../tests/test-utils';
import { Attachment } from '../../../../types/network/models/attachmentTypes';

vi.mock('../../../../network/apis/RoomsApi', () => ({
	getRoomAttachments: vi.fn()
}));

const mockedGetRoomAttachments = vi.mocked(getRoomAttachments);

const roomId = 'room-1';

const buildAttachment = (id: string, createdAt: string): Attachment => ({
	id,
	name: `${id}.txt`,
	size: 1024,
	mimeType: 'text/plain',
	userId: 'u',
	roomId,
	createdAt
});

beforeEach(() => {
	mockedGetRoomAttachments.mockReset();
});

describe('MediaGalleryTab', () => {
	test('shows the initial skeleton while the first page is loading', () => {
		mockedGetRoomAttachments.mockReturnValue(
			new Promise(() => {
				/* never resolves */
			})
		);
		setup(<MediaGalleryTab roomId={roomId} />);
		expect(screen.getByTestId('mediaGallerySkeleton')).toBeInTheDocument();
	});

	test('shows the empty state when the room has no attachments', async () => {
		mockedGetRoomAttachments.mockResolvedValue({ attachments: [], cursor: undefined });
		setup(<MediaGalleryTab roomId={roomId} />);
		expect(await screen.findByTestId('mediaGalleryEmptyState')).toBeInTheDocument();
	});

	test('renders attachments grouped by month-year header', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [
				buildAttachment('aug', '2021-08-15T10:00:00Z'),
				buildAttachment('may', '2021-05-10T10:00:00Z')
			],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		expect(await screen.findByTestId('mediaGalleryAttachment-aug')).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryAttachment-may')).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryMonthHeader-August 2021')).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryMonthHeader-May 2021')).toBeInTheDocument();
	});

	test('hides the load-more trigger when no further pages are available', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a1', '2024-01-01T10:00:00Z')],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		await screen.findByTestId('mediaGalleryAttachment-a1');
		expect(screen.queryByTestId('list-bottom-element')).not.toBeInTheDocument();
	});

	test('fetches the next page when the bottom element intersects the viewport', async () => {
		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('a1', '2024-01-01T10:00:00Z')],
			cursor: 'next-cursor'
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		const bottom = await screen.findByTestId('list-bottom-element');

		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('a2', '2024-01-02T10:00:00Z')],
			cursor: undefined
		});

		await triggerObserver(bottom);

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
		});

		expect(await screen.findByTestId('mediaGalleryAttachment-a2')).toBeInTheDocument();
	});
});
