/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { PreviewsManagerContext, type PreviewItem } from '@zextras/carbonio-ui-preview';
import { useTranslation } from 'react-i18next';

import { useMediaGalleryAttachments } from './useMediaGalleryAttachments';
import { bulkDeleteRoomAttachments } from '../network';
import { xmppClient } from '../network/xmpp/XMPPClient';
import { getUserId } from '../store/selectors/SessionSelectors';
import useStore from '../store/Store';
import { Attachment } from '../types/network/models/attachmentTypes';
import {
	BuildPreviewItemCallbacks,
	buildPreviewItem,
	downloadAttachment,
	isPreviewSupported
} from '../utils/attachmentUtils';

export type UseGalleryPreviewHook = {
	onPreviewClick: (attachment: Attachment) => void;
	closePreview: () => void;
	pendingDelete: Attachment | undefined;
	confirmPendingDelete: () => void;
	cancelPendingDelete: () => void;
};

export const useGalleryPreview = (roomId: string): UseGalleryPreviewHook => {
	const [t] = useTranslation();
	const sessionId = useStore(getUserId);
	const createSnackbar = useSnackbar();
	const removeMediaGalleryAttachment = useStore((store) => store.removeMediaGalleryAttachment);

	const { attachments, hasMore, isLoading, loadMore } = useMediaGalleryAttachments(roomId);
	const previewContext = useContext(PreviewsManagerContext);
	const initPreview = useMemo(
		() => previewContext?.initPreview ?? ((): void => undefined),
		[previewContext?.initPreview]
	);
	const openPreview = useMemo(
		() => previewContext?.openPreview ?? ((): void => undefined),
		[previewContext?.openPreview]
	);
	const emptyPreview = useMemo(
		() => previewContext?.emptyPreview ?? ((): void => undefined),
		[previewContext?.emptyPreview]
	);
	const previews = useMemo(() => previewContext?.previews ?? [], [previewContext?.previews]);
	const currentIndex = previewContext?.currentIndex ?? -1;

	const [openedId, setOpenedId] = useState<string | undefined>(undefined);
	const [pendingDelete, setPendingDelete] = useState<Attachment | undefined>(undefined);

	const downloadLabel = t('action.download', 'Download');
	const deleteLabel = t('action.delete', 'Delete');
	const closeLabel = t('action.close', 'Close');
	const labels = useMemo(
		() => ({ downloadLabel, deleteLabel, closeLabel }),
		[downloadLabel, deleteLabel, closeLabel]
	);

	const previewableItems = useMemo<PreviewItem[]>(() => {
		const items: PreviewItem[] = [];
		attachments.forEach((attachment) => {
			if (!isPreviewSupported(attachment.mimeType)) return;
			const callbacks: BuildPreviewItemCallbacks = {
				onDownload: (): void => downloadAttachment(attachment.id, attachment.name),
				onDelete:
					attachment.userId === sessionId ? (): void => setPendingDelete(attachment) : undefined
			};
			const item = buildPreviewItem(attachment, callbacks, labels);
			if (item) items.push(item);
		});
		return items;
	}, [attachments, sessionId, labels]);

	useEffect(() => {
		if (openedId === undefined) return;
		initPreview(previewableItems);
	}, [previewableItems, openedId, initPreview]);

	useEffect(() => {
		if (openedId === undefined) return;
		const idx = previews.findIndex((p) => p.id === openedId);
		if (idx === -1) {
			if (previews.length === 0) {
				setOpenedId(undefined);
				emptyPreview();
				return;
			}
			const last = previews[previews.length - 1];
			setOpenedId(last.id);
			openPreview(last.id);
			return;
		}
		if (idx !== currentIndex) {
			openPreview(openedId);
		}
		// currentIndex intentionally excluded: we only correct after the list itself changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [previews, openedId, emptyPreview, openPreview]);

	const prevCurrentIndexRef = useRef(currentIndex);
	useEffect(() => {
		const prev = prevCurrentIndexRef.current;
		prevCurrentIndexRef.current = currentIndex;
		if (prev >= 0 && currentIndex < 0) {
			setOpenedId(undefined);
			return;
		}
		if (currentIndex < 0) return;
		setOpenedId((prevId) => {
			if (prevId === undefined) return prevId;
			const item = previews[currentIndex];
			if (!item || prevId === item.id) return prevId;
			return item.id;
		});
	}, [currentIndex, previews]);

	useEffect(() => {
		if (openedId === undefined) return;
		if (currentIndex < 0) return;
		if (currentIndex !== previewableItems.length - 1) return;
		if (!hasMore || isLoading) return;
		loadMore();
	}, [openedId, currentIndex, previewableItems.length, hasMore, isLoading, loadMore]);

	const onPreviewClick = useCallback(
		(attachment: Attachment): void => {
			initPreview(previewableItems);
			setOpenedId(attachment.id);
		},
		[previewableItems, initPreview]
	);

	const closePreview = useCallback((): void => {
		emptyPreview();
		setOpenedId(undefined);
	}, [emptyPreview]);

	const cancelPendingDelete = useCallback((): void => setPendingDelete(undefined), []);

	const confirmPendingDelete = useCallback((): void => {
		if (!pendingDelete) return;
		const attachment = pendingDelete;
		setPendingDelete(undefined);

		const deletedIdx = previews.findIndex((p) => p.id === attachment.id);
		if (deletedIdx === currentIndex) {
			if (previews.length === 1) {
				emptyPreview();
				setOpenedId(undefined);
			} else if (deletedIdx === previews.length - 1) {
				const prev = previews[deletedIdx - 1];
				setOpenedId(prev.id);
				openPreview(prev.id);
			}
		}

		const successLabel = t('feedback.attachmentDeleted', 'Attachment deleted');
		const errorLabel = t('feedback.attachmentDeleteError', 'Could not delete the attachment');
		const showSnackbar = (severity: 'success' | 'error', label: string): void => {
			createSnackbar({
				key: new Date().toLocaleString(),
				severity,
				label,
				hideButton: true
			});
		};

		bulkDeleteRoomAttachments(attachment.roomId, [attachment.id])
			.then((response) => {
				if (response.failedIds?.includes(attachment.id)) {
					showSnackbar('error', errorLabel);
					return;
				}
				removeMediaGalleryAttachment(attachment.roomId, attachment.id);
				if (attachment.stanzaId) {
					xmppClient.sendChatMessageDeletion(attachment.roomId, attachment.stanzaId);
				}
				showSnackbar('success', successLabel);
			})
			.catch(() => showSnackbar('error', errorLabel));
	}, [
		pendingDelete,
		previews,
		currentIndex,
		emptyPreview,
		openPreview,
		t,
		createSnackbar,
		removeMediaGalleryAttachment
	]);

	return {
		onPreviewClick,
		closePreview,
		pendingDelete,
		confirmPendingDelete,
		cancelPendingDelete
	};
};

export default useGalleryPreview;
