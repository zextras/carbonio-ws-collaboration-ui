/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, within } from '@testing-library/react';

import { AttachmentGrid } from './AttachmentGrid';
import useStore from '../../../../store/Store';
import { screen, setup } from '../../../../tests/test-utils';
import { Attachment } from '../../../../types/network/models/attachmentTypes';

const roomId = 'room-1';

const buildAttachment = (id: string, overrides?: Partial<Attachment>): Attachment => ({
	id,
	name: `${id}.png`,
	size: 1024,
	mimeType: 'image/png',
	userId: 'u',
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

const gridProps = {
	hasMore: false,
	isLoading: false,
	loadMore: vi.fn()
};

describe('AttachmentGrid', () => {
	test('chunks the attachments of a month into rows of four tiles', () => {
		const attachments = ['a1', 'a2', 'a3', 'a4', 'a5'].map((id) => buildAttachment(id));
		setup(<AttachmentGrid attachments={attachments} {...gridProps} />);

		const rows = screen.getAllByTestId(/^mediaGalleryGridRow-/);
		expect(rows).toHaveLength(2);
		expect(within(rows[0]).getAllByTestId(/^mediaGalleryAttachmentClickArea-/)).toHaveLength(4);
		expect(within(rows[1]).getAllByTestId(/^mediaGalleryAttachmentClickArea-/)).toHaveLength(1);
	});

	test('starts a new row group for each month', () => {
		const attachments = [
			buildAttachment('aug', { createdAt: '2021-08-15T10:00:00Z' }),
			buildAttachment('may', { createdAt: '2021-05-10T10:00:00Z' })
		];
		setup(<AttachmentGrid attachments={attachments} {...gridProps} />);

		expect(screen.getByTestId('mediaGalleryMonthHeader-August 2021')).toBeInTheDocument();
		expect(screen.getByTestId('mediaGalleryMonthHeader-May 2021')).toBeInTheDocument();
		expect(screen.getAllByTestId(/^mediaGalleryGridRow-/)).toHaveLength(2);
	});

	test('shows the video badge only on video tiles', () => {
		const attachments = [
			buildAttachment('img-1'),
			buildAttachment('vid-1', { name: 'vid-1.mp4', mimeType: 'video/mp4' })
		];
		setup(<AttachmentGrid attachments={attachments} {...gridProps} />);

		expect(screen.getByTestId('mediaGalleryVideoBadge-vid-1')).toBeInTheDocument();
		expect(screen.queryByTestId('mediaGalleryVideoBadge-img-1')).not.toBeInTheDocument();
	});

	test('shows the placeholder icon while the tile has not become visible yet', () => {
		setup(<AttachmentGrid attachments={[buildAttachment('a1')]} {...gridProps} />);
		expect(screen.getByTestId('mediaGalleryTileIcon-a1')).toBeInTheDocument();
	});

	test('clicking a previewable tile opens the gallery preview session', async () => {
		const attachment = buildAttachment('a1');
		const { user } = setup(<AttachmentGrid attachments={[attachment]} {...gridProps} />);

		await user.click(screen.getByTestId('mediaGalleryAttachmentClickArea-a1'));

		const { active } = useStore.getState().previewNavigation;
		expect(active?.source).toBe('gallery');
		expect(active?.openTargetId).toBe('a1');
	});

	test('right-click on a tile opens the contextual menu with download and forward', async () => {
		const attachment = buildAttachment('a1', { stanzaId: 'stanza-1' });
		setup(<AttachmentGrid attachments={[attachment]} {...gridProps} />);

		fireEvent.contextMenu(screen.getByTestId('mediaGalleryAttachmentClickArea-a1'));

		expect(await screen.findByText('Download')).toBeInTheDocument();
		expect(screen.getByText('Forward')).toBeInTheDocument();
	});

	test('clicking a non-previewable tile does not open a preview session', async () => {
		const attachment = buildAttachment('mkv-1', {
			name: 'mkv-1.mkv',
			mimeType: 'video/x-matroska'
		});
		const { user } = setup(<AttachmentGrid attachments={[attachment]} {...gridProps} />);

		await user.click(screen.getByTestId('mediaGalleryAttachmentClickArea-mkv-1'));

		expect(useStore.getState().previewNavigation.active).toBeNull();
	});
});
