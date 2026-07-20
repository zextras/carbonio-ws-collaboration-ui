/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { MediaGalleryTab } from './MediaGalleryTab';
import { bulkDeleteRoomAttachments, getRoomAttachments } from '../../../../network';
import useStore from '../../../../store/Store';
import { screen, setup, triggerObserver } from '../../../../tests/test-utils';
import { Attachment } from '../../../../types/network/models/attachmentTypes';

vi.mock('../../../../network/apis/RoomsApi', () => ({
	getRoomAttachments: vi.fn(),
	bulkDeleteRoomAttachments: vi.fn()
}));

const mockedGetRoomAttachments = vi.mocked(getRoomAttachments);
const mockedBulkDelete = vi.mocked(bulkDeleteRoomAttachments);

const roomId = 'room-1';
const SAMPLE_CREATED_AT = '2024-01-01T10:00:00Z';
const AUG_CREATED_AT = '2021-08-15T10:00:00Z';
const AUG_TEST_ID = 'mediaGalleryAttachmentClickArea-aug';
const A1_TEST_ID = 'mediaGalleryAttachmentClickArea-a1';
const MAY_CREATED_AT = '2021-05-10T10:00:00Z';

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
			attachments: [buildAttachment('aug', AUG_CREATED_AT), buildAttachment('may', MAY_CREATED_AT)],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		expect(await screen.findByTestId(AUG_TEST_ID)).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryAttachmentClickArea-may')).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryMonthHeader-August 2021')).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryMonthHeader-May 2021')).toBeInTheDocument();
	});

	test('the Docs list renders a divider between consecutive month groups but not before the first', async () => {
		mockedGetRoomAttachments.mockResolvedValueOnce({ attachments: [], cursor: undefined });
		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('aug', AUG_CREATED_AT), buildAttachment('may', MAY_CREATED_AT)],
			cursor: undefined
		});

		const { user } = setup(<MediaGalleryTab roomId={roomId} />);
		await screen.findByTestId('mediaGalleryEmptyState');
		await user.click(screen.getByTestId('mediaGalleryCategory-docs'));

		await screen.findByTestId(AUG_TEST_ID);
		const dividers = screen.getAllByTestId(/^mediaGalleryMonthDivider-/);
		expect(dividers).toHaveLength(1);
	});

	test('the grid renders month headers but no dividers', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('aug', AUG_CREATED_AT), buildAttachment('may', MAY_CREATED_AT)],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		await screen.findByTestId(AUG_TEST_ID);
		expect(screen.getByTestId('mediaGalleryMonthHeader-August 2021')).toBeInTheDocument();
		expect(screen.queryAllByTestId(/^mediaGalleryMonthDivider-/)).toHaveLength(0);
	});

	test('shows the total counter chip when the response carries a total', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a1', SAMPLE_CREATED_AT)],
			cursor: undefined,
			total: 4758
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		expect(await screen.findByTestId('mediaGalleryTotalCounter')).toHaveTextContent('4758 images');
	});

	test('hides the total counter chip when the response has no total', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a1', SAMPLE_CREATED_AT)],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		await screen.findByTestId(A1_TEST_ID);
		expect(screen.queryByTestId('mediaGalleryTotalCounter')).not.toBeInTheDocument();
	});

	test('hides the load-more trigger when no further pages are available', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a1', SAMPLE_CREATED_AT)],
			cursor: undefined
		});

		setup(<MediaGalleryTab roomId={roomId} />);

		await screen.findByTestId(A1_TEST_ID);
		expect(screen.queryByTestId('list-bottom-element')).not.toBeInTheDocument();
	});

	test('selecting "You" in the Sent by dropdown refetches with userId of the logged user', async () => {
		const myUserId = 'me';
		useStore.getState().setLoginInfo({ id: myUserId, name: 'Me' });
		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('a1', SAMPLE_CREATED_AT)],
			cursor: undefined
		});

		const { user } = setup(<MediaGalleryTab roomId={roomId} />);
		await screen.findByTestId(A1_TEST_ID);

		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('mine-1', '2024-02-01T10:00:00Z')],
			cursor: undefined
		});

		await user.click(screen.getByTestId('mediaGallerySentByFilterButton'));
		await user.click(await screen.findByTestId('mediaGallerySentBy-you'));

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
		});
		expect(mockedGetRoomAttachments).toHaveBeenLastCalledWith(
			roomId,
			expect.objectContaining({ userId: myUserId, cursor: undefined })
		);
		expect(await screen.findByTestId('mediaGalleryAttachmentClickArea-mine-1')).toBeInTheDocument();
	});

	test('the first fetch requests the Images category', async () => {
		mockedGetRoomAttachments.mockResolvedValue({ attachments: [], cursor: undefined });
		setup(<MediaGalleryTab roomId={roomId} />);
		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledWith(
				roomId,
				expect.objectContaining({ mimeTypeCategory: 'IMAGES' })
			);
		});
	});

	test('switching category tab fetches that category and switching back reuses the cache', async () => {
		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('img-1', SAMPLE_CREATED_AT)],
			cursor: undefined
		});

		const { user } = setup(<MediaGalleryTab roomId={roomId} />);
		await screen.findByTestId('mediaGalleryAttachmentClickArea-img-1');

		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('vid-1', '2024-02-01T10:00:00Z')],
			cursor: undefined
		});

		await user.click(screen.getByTestId('mediaGalleryCategory-videos'));

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
		});
		expect(mockedGetRoomAttachments).toHaveBeenLastCalledWith(
			roomId,
			expect.objectContaining({ mimeTypeCategory: 'VIDEOS' })
		);
		expect(await screen.findByTestId('mediaGalleryAttachmentClickArea-vid-1')).toBeInTheDocument();

		// Going back to Images shows the cached bucket without a new request.
		await user.click(screen.getByTestId('mediaGalleryCategory-images'));
		expect(await screen.findByTestId('mediaGalleryAttachmentClickArea-img-1')).toBeInTheDocument();
		expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
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

	describe('selection mode', () => {
		const myUserId = 'me';
		const SELECT_A1_TEST_ID = 'mediaGallerySelect-a1';
		const SELECT_A2_TEST_ID = 'mediaGallerySelect-a2';
		const SELECTION_HEADER_TEST_ID = 'mediaGallerySelectionHeader';

		const seedTwoAttachments = (overrides?: Partial<Attachment>): void => {
			mockedGetRoomAttachments.mockResolvedValueOnce({
				attachments: [
					{ ...buildAttachment('a1', SAMPLE_CREATED_AT), userId: myUserId, ...overrides },
					{ ...buildAttachment('a2', SAMPLE_CREATED_AT), userId: myUserId, ...overrides }
				],
				cursor: undefined,
				total: 2
			});
		};

		beforeEach(() => {
			useStore.getState().setLoginInfo({ id: myUserId, name: 'Me' });
		});

		test('checking items enters selection mode with counter, bulk bar and no total chip', async () => {
			seedTwoAttachments();
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			expect(screen.getByTestId('mediaGalleryTotalCounter')).toBeInTheDocument();

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			expect(screen.getByTestId(SELECTION_HEADER_TEST_ID)).toHaveTextContent('1 selected');
			expect(screen.getByTestId('mediaGalleryBulkActionsBar')).toBeInTheDocument();
			expect(screen.queryByTestId('mediaGalleryTotalCounter')).not.toBeInTheDocument();

			await user.click(screen.getByTestId(SELECT_A2_TEST_ID));
			expect(screen.getByTestId(SELECTION_HEADER_TEST_ID)).toHaveTextContent('2 selected');

			await user.click(screen.getByTestId(SELECT_A2_TEST_ID));
			expect(screen.getByTestId(SELECTION_HEADER_TEST_ID)).toHaveTextContent('1 selected');
		});

		test('Cancel clears the selection and leaves selection mode', async () => {
			seedTwoAttachments();
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			await user.click(screen.getByTestId('mediaGallerySelectionCancel'));

			expect(screen.queryByTestId(SELECTION_HEADER_TEST_ID)).not.toBeInTheDocument();
			expect(screen.queryByTestId('mediaGalleryBulkActionsBar')).not.toBeInTheDocument();
		});

		test('clicking an item in selection mode toggles it instead of opening the preview', async () => {
			seedTwoAttachments();
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			await user.click(screen.getByTestId('mediaGalleryAttachmentClickArea-a2'));

			expect(screen.getByTestId(SELECTION_HEADER_TEST_ID)).toHaveTextContent('2 selected');
			expect(useStore.getState().previewNavigation.active).toBeNull();
		});

		test('switching category clears the selection', async () => {
			seedTwoAttachments();
			mockedGetRoomAttachments.mockResolvedValueOnce({ attachments: [], cursor: undefined });
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			expect(screen.getByTestId(SELECTION_HEADER_TEST_ID)).toBeInTheDocument();

			await user.click(screen.getByTestId('mediaGalleryCategory-videos'));
			await waitFor(() => {
				expect(screen.queryByTestId(SELECTION_HEADER_TEST_ID)).not.toBeInTheDocument();
			});
		});

		test('the contextual menu is disabled in selection mode', async () => {
			seedTwoAttachments({ stanzaId: 'stanza-1' });
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			fireEvent.contextMenu(screen.getByTestId(A1_TEST_ID));

			expect(screen.queryByText('Download')).not.toBeInTheDocument();
		});

		test('bulk delete calls the API with all the ids, updates the store and exits selection', async () => {
			seedTwoAttachments();
			mockedBulkDelete.mockResolvedValue({ successIds: ['a1', 'a2'], failedIds: [] });
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			await user.click(screen.getByTestId(SELECT_A2_TEST_ID));
			await user.click(screen.getByTestId('mediaGalleryBulkDelete'));
			await user.click(await screen.findByRole('button', { name: /yes, delete attachment/i }));

			await waitFor(() => {
				expect(mockedBulkDelete).toHaveBeenCalledWith(roomId, ['a1', 'a2']);
			});
			await waitFor(() => {
				expect(screen.queryByTestId(SELECTION_HEADER_TEST_ID)).not.toBeInTheDocument();
			});
			expect(await screen.findByTestId('mediaGalleryEmptyState')).toBeInTheDocument();
		});

		test('bulk delete is disabled when a selected attachment belongs to another user', async () => {
			mockedGetRoomAttachments.mockResolvedValueOnce({
				attachments: [
					{ ...buildAttachment('a1', SAMPLE_CREATED_AT), userId: myUserId },
					{ ...buildAttachment('a2', SAMPLE_CREATED_AT), userId: 'someone-else' }
				],
				cursor: undefined
			});
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			expect(screen.getByTestId('mediaGalleryBulkDelete')).toBeEnabled();

			await user.click(screen.getByTestId(SELECT_A2_TEST_ID));
			expect(screen.getByTestId('mediaGalleryBulkDelete')).toBeDisabled();
		});

		test('bulk forward is disabled when a selected attachment has no stanzaId', async () => {
			mockedGetRoomAttachments.mockResolvedValueOnce({
				attachments: [
					{ ...buildAttachment('a1', SAMPLE_CREATED_AT), stanzaId: 'stanza-1' },
					{ ...buildAttachment('a2', SAMPLE_CREATED_AT), stanzaId: undefined }
				],
				cursor: undefined
			});
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			expect(screen.getByTestId('mediaGalleryBulkForward')).toBeEnabled();

			await user.click(screen.getByTestId(SELECT_A2_TEST_ID));
			expect(screen.getByTestId('mediaGalleryBulkForward')).toBeDisabled();
		});

		test('bulk forward opens the forward modal for the selected attachments', async () => {
			seedTwoAttachments({ stanzaId: 'stanza-1' });
			const { user } = setup(<MediaGalleryTab roomId={roomId} />);
			await screen.findByTestId(A1_TEST_ID);

			await user.click(screen.getByTestId(SELECT_A1_TEST_ID));
			await user.click(screen.getByTestId(SELECT_A2_TEST_ID));
			await user.click(screen.getByTestId('mediaGalleryBulkForward'));

			expect(await screen.findByTestId('chip_input_forward_modal')).toBeInTheDocument();
		});
	});
});
