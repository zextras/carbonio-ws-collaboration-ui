/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { getRoomAttachments } from '../network';
import {
	getMediaGalleryAttachments,
	getMediaGalleryFilter,
	getMediaGalleryHasMore
} from '../store/selectors/MediaGallerySelectors';
import useStore from '../store/Store';
import { Attachment } from '../types/network/models/attachmentTypes';
import { AttachmentMessageType } from '../types/store/ChatsRegistryTypes';

export const PREVIEW_NAVIGATION_PAGE_SIZE = 20;
const CHAT_ANCHOR_BUFFER_MS = 24 * 60 * 60 * 1000;

type UsePreviewNavigation = {
	openFromGallery: (roomId: string, clickedAttachment: Attachment) => void;
	openFromChat: (
		roomId: string,
		clickedAttachment: AttachmentMessageType,
		messageDate: number
	) => Promise<void>;
};

const usePreviewNavigation = (): UsePreviewNavigation => {
	const startPreviewNavigation = useStore((state) => state.startPreviewNavigation);
	const appendPreviewNavigationPage = useStore((state) => state.appendPreviewNavigationPage);
	const setPreviewNavigationLoading = useStore((state) => state.setPreviewNavigationLoading);

	const openFromGallery = useCallback(
		(roomId: string, clickedAttachment: Attachment): void => {
			const state = useStore.getState();
			const attachments = getMediaGalleryAttachments(state, roomId);
			const hasMore = getMediaGalleryHasMore(state, roomId);
			const filter = getMediaGalleryFilter(state, roomId);
			const galleryRoom = state.mediaGallery[roomId];
			startPreviewNavigation({
				source: 'gallery',
				roomId,
				sortBy: filter.sortBy,
				order: filter.order,
				userId: filter.userId,
				attachments,
				nextCursor: galleryRoom?.nextCursor,
				hasMore,
				isLoading: false,
				openTargetId: clickedAttachment.id
			});
		},
		[startPreviewNavigation]
	);

	const openFromChat = useCallback(
		async (
			roomId: string,
			clickedAttachment: AttachmentMessageType,
			messageDate: number
		): Promise<void> => {
			startPreviewNavigation({
				source: 'chat',
				roomId,
				sortBy: 'created_at',
				order: 'desc',
				attachments: [],
				nextCursor: undefined,
				hasMore: true,
				isLoading: true,
				openTargetId: clickedAttachment.id
			});

			const anchorIso = new Date(messageDate + CHAT_ANCHOR_BUFFER_MS).toISOString();
			let cursor: string | undefined;
			let isFirst = true;
			let done = false;

			try {
				while (!done) {
					const params = {
						limit: PREVIEW_NAVIGATION_PAGE_SIZE,
						sortBy: 'created_at' as const,
						order: 'desc' as const,
						...(isFirst ? { createdBefore: anchorIso } : {}),
						...(cursor ? { cursor } : {})
					};
					// eslint-disable-next-line no-await-in-loop
					const response = await getRoomAttachments(roomId, params);
					const { active } = useStore.getState().previewNavigation;
					if (active?.roomId !== roomId || active.source !== 'chat') return;
					appendPreviewNavigationPage(response.attachments, response.cursor);
					const found = response.attachments.some((a) => a.id === clickedAttachment.id);
					if (found || response.cursor === undefined) {
						done = true;
					} else {
						cursor = response.cursor;
						isFirst = false;
						setPreviewNavigationLoading(true);
					}
				}
			} catch (error) {
				console.error('Failed to fetch chat attachments for preview', error);
				setPreviewNavigationLoading(false);
			}
		},
		[appendPreviewNavigationPage, setPreviewNavigationLoading, startPreviewNavigation]
	);

	return { openFromGallery, openFromChat };
};

export default usePreviewNavigation;
