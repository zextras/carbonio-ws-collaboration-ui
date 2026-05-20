/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Attachment,
	AttachmentsSortBy,
	AttachmentsSortOrder
} from '../network/models/attachmentTypes';

export type PreviewNavigationSession = {
	source: 'gallery' | 'chat';
	roomId: string;
	sortBy: AttachmentsSortBy;
	order: AttachmentsSortOrder;
	userId?: string;
	attachments: Array<Attachment>;
	nextCursor?: string;
	hasMore: boolean;
	isLoading: boolean;
	openTargetId?: string;
};

export type PreviewNavigationStoreSlice = {
	previewNavigation: { active: PreviewNavigationSession | null };
	startPreviewNavigation: (session: PreviewNavigationSession) => void;
	appendPreviewNavigationPage: (
		attachments: Array<Attachment>,
		nextCursor: string | undefined
	) => void;
	setPreviewNavigationLoading: (isLoading: boolean) => void;
	removePreviewNavigationAttachment: (attachmentId: string) => void;
	clearPreviewNavigationOpenTarget: () => void;
	clearPreviewNavigation: () => void;
};
