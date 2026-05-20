/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'i18next';

import { buildPreviewItem } from './previewNavigationUtils';
import { Attachment } from '../types/network/models/attachmentTypes';

const t = ((_key: string, fallback?: string): string => fallback ?? _key) as unknown as TFunction;

const buildAttachment = (overrides?: Partial<Attachment>): Attachment => ({
	id: 'att-1',
	name: 'image.png',
	size: 2048,
	mimeType: 'image/png',
	userId: 'u-1',
	roomId: 'room-1',
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

describe('previewNavigationUtils', () => {
	describe('buildPreviewItem', () => {
		test('returns null when the MIME type is not previewable', () => {
			const item = buildPreviewItem(buildAttachment({ mimeType: 'application/zip' }), t);
			expect(item).toBeNull();
		});

		test('builds an image preview item', () => {
			const item = buildPreviewItem(buildAttachment({ mimeType: 'image/png' }), t);
			expect(item).not.toBeNull();
			expect(item?.previewType).toBe('image');
			expect(item?.id).toBe('att-1');
			expect(item?.filename).toBe('image.png');
		});

		test('builds a pdf preview item', () => {
			const item = buildPreviewItem(
				buildAttachment({ mimeType: 'application/pdf', name: 'doc.pdf' }),
				t
			);
			expect(item?.previewType).toBe('pdf');
			expect(item?.filename).toBe('doc.pdf');
		});

		test('builds a video preview item with mimeType and errorLabel', () => {
			const item = buildPreviewItem(
				buildAttachment({ mimeType: 'video/mp4', name: 'clip.mp4' }),
				t
			);
			expect(item?.previewType).toBe('video');
			if (item?.previewType === 'video') {
				expect(item.mimeType).toBe('video/mp4');
				expect(item.errorLabel).toBeDefined();
			}
		});

		test('exposes previous/next tooltips on the built item', () => {
			const item = buildPreviewItem(buildAttachment(), t);
			expect(item?.previousTooltip).toBe('Previous');
			expect(item?.nextTooltip).toBe('Next');
		});

		test('does not include a delete action when onDelete is not provided', () => {
			const item = buildPreviewItem(buildAttachment(), t);
			expect(item?.actions?.map((a) => a.id)).toEqual(['DownloadOutline']);
		});

		test('includes a delete action that forwards the attachment id when onDelete is provided', () => {
			const onDelete = vi.fn();
			const item = buildPreviewItem(buildAttachment({ id: 'att-9' }), t, { onDelete });
			const deleteAction = item?.actions?.find((a) => a.id === 'Trash2Outline');
			expect(deleteAction).toBeDefined();
			deleteAction?.onClick({ preventDefault: vi.fn() } as never);
			expect(onDelete).toHaveBeenCalledWith('att-9');
		});

		test('download action triggers preventDefault on its event', () => {
			const item = buildPreviewItem(buildAttachment(), t);
			const downloadAction = item?.actions?.find((a) => a.id === 'DownloadOutline');
			const preventDefault = vi.fn();
			downloadAction?.onClick({ preventDefault } as never);
			expect(preventDefault).toHaveBeenCalled();
		});
	});
});
