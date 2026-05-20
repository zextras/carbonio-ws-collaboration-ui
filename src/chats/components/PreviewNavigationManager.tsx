/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { PreviewItem, PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { useTranslation } from 'react-i18next';

import { DeleteAttachmentModal } from './infoPanel/mediaGallery/DeleteAttachmentModal';
import { PREVIEW_NAVIGATION_PAGE_SIZE } from '../../hooks/usePreviewNavigation';
import { bulkDeleteRoomAttachments, getRoomAttachments } from '../../network';
import { xmppClient } from '../../network/xmpp/XMPPClient';
import {
	getPreviewNavigationActive,
	getPreviewNavigationOpenTargetId
} from '../../store/selectors/PreviewNavigationSelectors';
import { getUserId } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { Attachment } from '../../types/network/models/attachmentTypes';
import { PreviewNavigationSession } from '../../types/store/PreviewNavigationTypes';
import { buildPreviewItem } from '../../utils/previewNavigationUtils';

const shouldLoadMore = (
	session: PreviewNavigationSession,
	currentIndex: number,
	previewsLength: number,
	lastRequestedLength: number
): boolean => {
	if (!session.hasMore || session.isLoading) return false;
	if (currentIndex === -1) return false;
	if (lastRequestedLength === previewsLength) return false;
	// Cursor always advances toward older items. For gallery (rendered newest→oldest)
	// that's the right edge; for chat (rendered oldest→newest after reverse) it's the
	// left edge.
	return session.source === 'chat' ? currentIndex <= 1 : currentIndex + 1 >= previewsLength - 1;
};

const PreviewNavigationManager = (): React.JSX.Element | null => {
	const [t] = useTranslation();
	const successLabel = t('feedback.attachmentDeleted', 'Attachment deleted');
	const errorLabel = t('feedback.attachmentDeleteError', 'Could not delete the attachment');

	const session = useStore(getPreviewNavigationActive);
	const openTargetId = useStore(getPreviewNavigationOpenTargetId);
	const sessionId = useStore(getUserId);
	const appendPreviewNavigationPage = useStore((s) => s.appendPreviewNavigationPage);
	const setPreviewNavigationLoading = useStore((s) => s.setPreviewNavigationLoading);
	const removePreviewNavigationAttachment = useStore((s) => s.removePreviewNavigationAttachment);
	const clearPreviewNavigationOpenTarget = useStore((s) => s.clearPreviewNavigationOpenTarget);
	const clearPreviewNavigation = useStore((s) => s.clearPreviewNavigation);
	const removeMediaGalleryAttachment = useStore((s) => s.removeMediaGalleryAttachment);

	const { initPreview, openPreview, emptyPreview, previews, currentIndex } =
		useContext(PreviewsManagerContext);

	const createSnackbar = useSnackbar();
	const showSnackbar = useCallback(
		(severity: 'success' | 'error', label: string): void => {
			createSnackbar({
				key: new Date().toLocaleString(),
				severity,
				label,
				hideButton: true
			});
		},
		[createSnackbar]
	);

	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

	const attachmentsById = useMemo(() => {
		const map = new Map<string, Attachment>();
		session?.attachments.forEach((a) => map.set(a.id, a));
		return map;
	}, [session?.attachments]);

	const orderedItems = useMemo<Array<PreviewItem>>(() => {
		if (!session) return [];
		const items = session.attachments.reduce<Array<PreviewItem>>((acc, att) => {
			const canDelete = att.userId === sessionId;
			const item = buildPreviewItem(att, t, {
				onDelete: canDelete ? (id): void => setPendingDeleteId(id) : undefined
			});
			if (item) acc.push(item);
			return acc;
		}, []);
		return session.source === 'chat' ? [...items].reverse() : items;
	}, [session, sessionId, t]);

	const closeDeleteModal = useCallback(() => setPendingDeleteId(null), []);

	const confirmDelete = useCallback(() => {
		if (!pendingDeleteId) return;
		const target = attachmentsById.get(pendingDeleteId);
		setPendingDeleteId(null);
		if (!target) return;
		bulkDeleteRoomAttachments(target.roomId, [target.id])
			.then((response) => {
				if (response.failedIds?.includes(target.id)) {
					showSnackbar('error', errorLabel);
					return;
				}
				removePreviewNavigationAttachment(target.id);
				removeMediaGalleryAttachment(target.roomId, target.id);
				if (target.stanzaId) {
					xmppClient.sendChatMessageDeletion(target.roomId, target.stanzaId);
				}
				showSnackbar('success', successLabel);
			})
			.catch(() => showSnackbar('error', errorLabel));
	}, [
		attachmentsById,
		errorLabel,
		pendingDeleteId,
		removeMediaGalleryAttachment,
		removePreviewNavigationAttachment,
		showSnackbar,
		successLabel
	]);

	useEffect(() => {
		if (!session) return;
		initPreview(orderedItems);
	}, [orderedItems, initPreview, session]);

	useEffect(() => {
		if (!session) return;
		if (currentIndex === -1) return;
		if (currentIndex < orderedItems.length) return;
		const fallback = orderedItems.at(-1);
		if (fallback) {
			openPreview(fallback.id);
		} else {
			emptyPreview();
			clearPreviewNavigation();
		}
	}, [clearPreviewNavigation, currentIndex, emptyPreview, openPreview, orderedItems, session]);

	useEffect(() => {
		if (!session || !openTargetId) return;
		if (!previews.some((item) => item.id === openTargetId)) return;
		if (currentIndex !== -1 && previews[currentIndex]?.id === openTargetId) return;
		openPreview(openTargetId);
	}, [currentIndex, openPreview, openTargetId, previews, session]);

	useEffect(() => {
		if (!session || !openTargetId) return;
		if (currentIndex === -1) return;
		if (previews[currentIndex]?.id !== openTargetId) return;
		clearPreviewNavigationOpenTarget();
	}, [clearPreviewNavigationOpenTarget, currentIndex, openTargetId, previews, session]);

	const lastRequestedLength = useRef<number>(-1);
	useEffect(() => {
		if (!session) {
			lastRequestedLength.current = -1;
			return;
		}
		if (!shouldLoadMore(session, currentIndex, previews.length, lastRequestedLength.current)) {
			return;
		}
		lastRequestedLength.current = previews.length;

		setPreviewNavigationLoading(true);
		getRoomAttachments(session.roomId, {
			limit: PREVIEW_NAVIGATION_PAGE_SIZE,
			cursor: session.nextCursor,
			userId: session.userId,
			sortBy: session.sortBy,
			order: session.order
		})
			.then((response) => {
				const { active } = useStore.getState().previewNavigation;
				if (active?.roomId !== session.roomId) return;
				appendPreviewNavigationPage(response.attachments, response.cursor);
			})
			.catch((error) => {
				console.error('Failed to lazy-load preview attachments', error);
				setPreviewNavigationLoading(false);
			});
	}, [
		appendPreviewNavigationPage,
		currentIndex,
		previews.length,
		session,
		setPreviewNavigationLoading
	]);

	// Chat: items prepend to the rendered array on page append, so the library's
	// currentIndex needs to shift to keep the same item visible.
	const prevPreviewsRef = useRef<typeof previews>([]);
	const prevCurrentIndexRef = useRef<number>(-1);
	useEffect(() => {
		const prevPreviews = prevPreviewsRef.current;
		const prevIndex = prevCurrentIndexRef.current;
		prevPreviewsRef.current = previews;
		prevCurrentIndexRef.current = currentIndex;

		if (session?.source !== 'chat') return;
		if (prevIndex === -1 || currentIndex === -1) return;
		const delta = previews.length - prevPreviews.length;
		if (delta <= 0) return;
		const shiftedItem = prevPreviews[prevIndex];
		if (!shiftedItem) return;
		const newIndex = previews.findIndex((p) => p.id === shiftedItem.id);
		if (newIndex === -1 || newIndex === currentIndex) return;
		openPreview(shiftedItem.id);
	}, [currentIndex, openPreview, previews, session]);

	const wasOpenRef = useRef(false);
	useEffect(() => {
		if (!session) {
			wasOpenRef.current = false;
			return;
		}
		if (currentIndex >= 0) {
			wasOpenRef.current = true;
			return;
		}
		if (wasOpenRef.current && currentIndex === -1) {
			wasOpenRef.current = false;
			emptyPreview();
			clearPreviewNavigation();
		}
	}, [clearPreviewNavigation, currentIndex, emptyPreview, session]);

	useEffect(() => {
		if (!session) return;
		if (session.isLoading || session.hasMore) return;
		if (orderedItems.length === 0) {
			emptyPreview();
			clearPreviewNavigation();
			return;
		}
		if (session.openTargetId && !orderedItems.some((i) => i.id === session.openTargetId)) {
			emptyPreview();
			clearPreviewNavigation();
		}
	}, [clearPreviewNavigation, emptyPreview, orderedItems, session]);

	useEffect(
		() => (): void => {
			emptyPreview();
			clearPreviewNavigation();
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	if (pendingDeleteId === null) return null;
	return <DeleteAttachmentModal open onConfirm={confirmDelete} onClose={closeDeleteModal} />;
};

export default PreviewNavigationManager;
