/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PreviewNavigationSession } from '../../types/store/PreviewNavigationTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getPreviewNavigationActive = (store: RootStore): PreviewNavigationSession | null =>
	store.previewNavigation.active;

export const getPreviewNavigationOpenTargetId = (store: RootStore): string | undefined =>
	store.previewNavigation.active?.openTargetId;
