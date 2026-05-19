/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../../types/network/models/attachmentTypes';
import {
	PreviewNavigationSession,
	PreviewNavigationSource
} from '../../types/store/PreviewNavigationTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getPreviewNavigationActive = (store: RootStore): PreviewNavigationSession | null =>
	store.previewNavigation.active;

export const getPreviewNavigationAttachments = (store: RootStore): Array<Attachment> =>
	store.previewNavigation.active?.attachments ?? [];

export const getPreviewNavigationHasMore = (store: RootStore): boolean =>
	store.previewNavigation.active?.hasMore ?? false;

export const getPreviewNavigationIsLoading = (store: RootStore): boolean =>
	store.previewNavigation.active?.isLoading ?? false;

export const getPreviewNavigationSource = (store: RootStore): PreviewNavigationSource | undefined =>
	store.previewNavigation.active?.source;

export const getPreviewNavigationOpenTargetId = (store: RootStore): string | undefined =>
	store.previewNavigation.active?.openTargetId;
