/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor } from '@testing-library/react';

import { MediaGalleryTab } from './MediaGalleryTab';
import { getRoomAttachments } from '../../../../network';
import useStore from '../../../../store/Store';
import { screen, setup, triggerObserver } from '../../../../tests/test-utils';
import { Attachment } from '../../../../types/network/models/attachmentTypes';

vi.mock('../../../../network/apis/RoomsApi', () => ({
	getRoomAttachments: vi.fn()
}));

const mockedGetRoomAttachments = vi.mocked(getRoomAttachments);

const roomId = 'room-1';
const SAMPLE_CREATED_AT = '2024-01-01T10:00:00Z';
const AUG_CREATED_AT = '2021-08-15T10:00:00Z';
const AUG_TEST_ID = 'mediaGalleryAttachmentClickArea-aug';

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
				buildAttachment('aug', AUG_CREATED_AT),
				buildAttachment('may', '2021-05-10T10:00:00Z')
			],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		expect(await screen.findByTestId(AUG_TEST_ID)).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryAttachmentClickArea-may')).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryMonthHeader-August 2021')).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryMonthHeader-May 2021')).toBeInTheDocument();
	});

	test('renders a divider between consecutive month groups but not before the first', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [
				buildAttachment('aug', AUG_CREATED_AT),
				buildAttachment('may', '2021-05-10T10:00:00Z')
			],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		await screen.findByTestId(AUG_TEST_ID);
		const dividers = screen.getAllByTestId(/^mediaGalleryMonthDivider-/);
		expect(dividers).toHaveLength(1);
	});

	test('does not render any month divider when there is a single group', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('aug', AUG_CREATED_AT)],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		await screen.findByTestId(AUG_TEST_ID);
		expect(screen.queryAllByTestId(/^mediaGalleryMonthDivider-/)).toHaveLength(0);
	});

	test('hides the load-more trigger when no further pages are available', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a1', SAMPLE_CREATED_AT)],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		await screen.findByTestId('mediaGalleryAttachmentClickArea-a1');
		expect(screen.queryByTestId('list-bottom-element')).not.toBeInTheDocument();
	});

	test('switching to "My attachments" refetches with userId of the logged user', async () => {
		const myUserId = 'me';
		useStore.getState().setLoginInfo({ id: myUserId, name: 'Me' });
		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('a1', SAMPLE_CREATED_AT)],
			cursor: undefined
		});

		const { user } = setup(<MediaGalleryTab roomId={roomId} />);
		await screen.findByTestId('mediaGalleryAttachmentClickArea-a1');

		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('mine-1', '2024-02-01T10:00:00Z')],
			cursor: undefined
		});

		await user.click(screen.getByTestId('mediaGalleryFilter-mine'));

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
		});
		expect(mockedGetRoomAttachments).toHaveBeenLastCalledWith(
			roomId,
			expect.objectContaining({ userId: myUserId, cursor: undefined })
		);
		expect(await screen.findByTestId('mediaGalleryAttachmentClickArea-mine-1')).toBeInTheDocument();
	});

	test('fetches the next page when the bottom element intersects the viewport', async () => {
		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('a1', SAMPLE_CREATED_AT)],
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

		expect(await screen.findByTestId('mediaGalleryAttachmentClickArea-a2')).toBeInTheDocument();
	});
});
