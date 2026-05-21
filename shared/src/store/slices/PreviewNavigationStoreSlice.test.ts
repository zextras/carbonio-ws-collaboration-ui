/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../../types/network/models/attachmentTypes';
import { PreviewNavigationSession } from '../../types/store/PreviewNavigationTypes';
import useStore from '../Store';

const roomId = 'room-1';

const buildAttachment = (id: string, overrides?: Partial<Attachment>): Attachment => ({
	id,
	name: `${id}.png`,
	size: 1024,
	mimeType: 'image/png',
	userId: 'u-1',
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

const baseSession: PreviewNavigationSession = {
	source: 'gallery',
	roomId,
	sortBy: 'created_at',
	order: 'desc',
	attachments: [buildAttachment('a-1')],
	nextCursor: 'cursor-1',
	hasMore: true,
	isLoading: false,
	openTargetId: 'a-1'
};

describe('PreviewNavigationStoreSlice', () => {
	beforeEach(() => {
		useStore.getState().clearPreviewNavigation();
	});

	test('initial state has no active session', () => {
		expect(useStore.getState().previewNavigation.active).toBeNull();
	});

	test('startPreviewNavigation sets the active session', () => {
		useStore.getState().startPreviewNavigation(baseSession);
		expect(useStore.getState().previewNavigation.active).toEqual(baseSession);
	});

	test('appendPreviewNavigationPage is a no-op when no active session', () => {
		useStore.getState().appendPreviewNavigationPage([buildAttachment('a-2')], 'cursor-2');
		expect(useStore.getState().previewNavigation.active).toBeNull();
	});

	test('appendPreviewNavigationPage appends new attachments and updates cursor/hasMore', () => {
		useStore.getState().startPreviewNavigation(baseSession);
		useStore.getState().appendPreviewNavigationPage([buildAttachment('a-2')], 'cursor-2');
		const { active } = useStore.getState().previewNavigation;
		expect(active?.attachments.map((a) => a.id)).toEqual(['a-1', 'a-2']);
		expect(active?.nextCursor).toBe('cursor-2');
		expect(active?.hasMore).toBe(true);
		expect(active?.isLoading).toBe(false);
	});

	test('appendPreviewNavigationPage deduplicates by attachment id', () => {
		useStore.getState().startPreviewNavigation(baseSession);
		useStore
			.getState()
			.appendPreviewNavigationPage([buildAttachment('a-1'), buildAttachment('a-2')], 'cursor-2');
		const { active } = useStore.getState().previewNavigation;
		expect(active?.attachments.map((a) => a.id)).toEqual(['a-1', 'a-2']);
	});

	test('appendPreviewNavigationPage sets hasMore=false when cursor is undefined', () => {
		useStore.getState().startPreviewNavigation(baseSession);
		useStore.getState().appendPreviewNavigationPage([buildAttachment('a-2')], undefined);
		const { active } = useStore.getState().previewNavigation;
		expect(active?.hasMore).toBe(false);
		expect(active?.nextCursor).toBeUndefined();
	});

	test('setPreviewNavigationLoading toggles isLoading', () => {
		useStore.getState().startPreviewNavigation({ ...baseSession, isLoading: false });
		useStore.getState().setPreviewNavigationLoading(true);
		expect(useStore.getState().previewNavigation.active?.isLoading).toBe(true);
		useStore.getState().setPreviewNavigationLoading(false);
		expect(useStore.getState().previewNavigation.active?.isLoading).toBe(false);
	});

	test('setPreviewNavigationLoading is a no-op when value is unchanged', () => {
		useStore.getState().startPreviewNavigation({ ...baseSession, isLoading: true });
		const before = useStore.getState().previewNavigation.active;
		useStore.getState().setPreviewNavigationLoading(true);
		const after = useStore.getState().previewNavigation.active;
		expect(after).toBe(before);
	});

	test('setPreviewNavigationLoading is a no-op when no active session', () => {
		useStore.getState().setPreviewNavigationLoading(true);
		expect(useStore.getState().previewNavigation.active).toBeNull();
	});

	test('removePreviewNavigationAttachment removes an attachment by id', () => {
		useStore.getState().startPreviewNavigation({
			...baseSession,
			attachments: [buildAttachment('a-1'), buildAttachment('a-2'), buildAttachment('a-3')]
		});
		useStore.getState().removePreviewNavigationAttachment('a-2');
		expect(useStore.getState().previewNavigation.active?.attachments.map((a) => a.id)).toEqual([
			'a-1',
			'a-3'
		]);
	});

	test('removePreviewNavigationAttachment is a no-op when id is not found', () => {
		useStore.getState().startPreviewNavigation(baseSession);
		useStore.getState().removePreviewNavigationAttachment('missing');
		expect(useStore.getState().previewNavigation.active?.attachments.map((a) => a.id)).toEqual([
			'a-1'
		]);
	});

	test('removePreviewNavigationAttachment is a no-op when no active session', () => {
		useStore.getState().removePreviewNavigationAttachment('a-1');
		expect(useStore.getState().previewNavigation.active).toBeNull();
	});

	test('clearPreviewNavigationOpenTarget clears openTargetId', () => {
		useStore.getState().startPreviewNavigation(baseSession);
		useStore.getState().clearPreviewNavigationOpenTarget();
		expect(useStore.getState().previewNavigation.active?.openTargetId).toBeUndefined();
	});

	test('clearPreviewNavigationOpenTarget is a no-op when no active session', () => {
		useStore.getState().clearPreviewNavigationOpenTarget();
		expect(useStore.getState().previewNavigation.active).toBeNull();
	});

	test('clearPreviewNavigation resets the active session to null', () => {
		useStore.getState().startPreviewNavigation(baseSession);
		useStore.getState().clearPreviewNavigation();
		expect(useStore.getState().previewNavigation.active).toBeNull();
	});
});
