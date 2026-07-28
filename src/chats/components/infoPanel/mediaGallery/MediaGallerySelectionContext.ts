/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createContext, useCallback, useMemo, useState } from 'react';

import { Attachment } from '../../../../types/network/models/attachmentTypes';

export type MediaGallerySelection = {
	isSelectionMode: boolean;
	selectedCount: number;
	selectedAttachments: Array<Attachment>;
	isSelected: (attachmentId: string) => boolean;
	toggleSelection: (attachment: Attachment) => void;
	clearSelection: () => void;
	pruneSelection: (attachments: Array<Attachment>) => void;
};

export const MediaGallerySelectionContext = createContext<MediaGallerySelection>({
	isSelectionMode: false,
	selectedCount: 0,
	selectedAttachments: [],
	isSelected: () => false,
	toggleSelection: () => undefined,
	clearSelection: () => undefined,
	pruneSelection: () => undefined
});

export const useMediaGallerySelectionState = (): MediaGallerySelection => {
	const [selected, setSelected] = useState<Map<string, Attachment>>(new Map());

	const toggleSelection = useCallback((attachment: Attachment): void => {
		setSelected((prev) => {
			const next = new Map(prev);
			if (next.has(attachment.id)) {
				next.delete(attachment.id);
			} else {
				next.set(attachment.id, attachment);
			}
			return next;
		});
	}, []);

	const clearSelection = useCallback((): void => {
		setSelected((prev) => (prev.size === 0 ? prev : new Map()));
	}, []);

	const pruneSelection = useCallback((attachments: Array<Attachment>): void => {
		setSelected((prev) => {
			if (prev.size === 0) return prev;
			const validIds = new Set(attachments.map((a) => a.id));
			const next = new Map(Array.from(prev).filter(([id]) => validIds.has(id)));
			return next.size === prev.size ? prev : next;
		});
	}, []);

	const isSelected = useCallback((attachmentId: string) => selected.has(attachmentId), [selected]);

	return useMemo(
		() => ({
			isSelectionMode: selected.size > 0,
			selectedCount: selected.size,
			selectedAttachments: Array.from(selected.values()),
			isSelected,
			toggleSelection,
			clearSelection,
			pruneSelection
		}),
		[selected, isSelected, toggleSelection, clearSelection, pruneSelection]
	);
};
