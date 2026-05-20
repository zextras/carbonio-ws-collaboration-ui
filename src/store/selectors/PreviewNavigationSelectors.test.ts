/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	getPreviewNavigationActive,
	getPreviewNavigationAttachments,
	getPreviewNavigationHasMore,
	getPreviewNavigationIsLoading,
	getPreviewNavigationOpenTargetId,
	getPreviewNavigationSource
} from './PreviewNavigationSelectors';
import { Attachment } from '../../types/network/models/attachmentTypes';
import { PreviewNavigationSession } from '../../types/store/PreviewNavigationTypes';
import useStore from '../Store';

const buildAttachment = (id: string): Attachment => ({
	id,
	name: `${id}.png`,
	size: 1024,
	mimeType: 'image/png',
	userId: 'u-1',
	roomId: 'room-1',
	createdAt: '2024-01-01T10:00:00Z'
});

const session: PreviewNavigationSession = {
	source: 'chat',
	roomId: 'room-1',
	sortBy: 'created_at',
	order: 'desc',
	attachments: [buildAttachment('a-1')],
	nextCursor: 'cursor-1',
	hasMore: true,
	isLoading: true,
	openTargetId: 'a-1'
};

describe('PreviewNavigationSelectors', () => {
	beforeEach(() => {
		useStore.getState().clearPreviewNavigation();
	});

	test('return inert defaults when no active session', () => {
		const store = useStore.getState();
		expect(getPreviewNavigationActive(store)).toBeNull();
		expect(getPreviewNavigationAttachments(store)).toEqual([]);
		expect(getPreviewNavigationHasMore(store)).toBe(false);
		expect(getPreviewNavigationIsLoading(store)).toBe(false);
		expect(getPreviewNavigationSource(store)).toBeUndefined();
		expect(getPreviewNavigationOpenTargetId(store)).toBeUndefined();
	});

	test('reflect the populated session', () => {
		useStore.getState().startPreviewNavigation(session);
		const store = useStore.getState();
		expect(getPreviewNavigationActive(store)).toEqual(session);
		expect(getPreviewNavigationAttachments(store)).toEqual(session.attachments);
		expect(getPreviewNavigationHasMore(store)).toBe(true);
		expect(getPreviewNavigationIsLoading(store)).toBe(true);
		expect(getPreviewNavigationSource(store)).toBe('chat');
		expect(getPreviewNavigationOpenTargetId(store)).toBe('a-1');
	});
});
