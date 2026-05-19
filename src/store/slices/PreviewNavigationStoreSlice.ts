/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { StateCreator } from 'zustand';

import { Attachment } from '../../types/network/models/attachmentTypes';
import {
	PreviewNavigationSession,
	PreviewNavigationStoreSlice
} from '../../types/store/PreviewNavigationTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const usePreviewNavigationStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	PreviewNavigationStoreSlice
> = (set) => ({
	previewNavigation: { active: null },
	startPreviewNavigation: (session: PreviewNavigationSession): void => {
		set(
			produce((draft: RootStore) => {
				draft.previewNavigation.active = session;
			}),
			false,
			'PN/START'
		);
	},
	appendPreviewNavigationPage: (
		attachments: Array<Attachment>,
		nextCursor: string | undefined
	): void => {
		set(
			produce((draft: RootStore) => {
				const { active } = draft.previewNavigation;
				if (!active) return;
				const existingIds = new Set(active.attachments.map((a) => a.id));
				const fresh = attachments.filter((a) => !existingIds.has(a.id));
				active.attachments.push(...fresh);
				active.nextCursor = nextCursor;
				active.hasMore = nextCursor !== undefined;
				active.isLoading = false;
			}),
			false,
			'PN/APPEND_PAGE'
		);
	},
	setPreviewNavigationLoading: (isLoading: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const { active } = draft.previewNavigation;
				if (!active) return;
				if (active.isLoading === isLoading) return;
				active.isLoading = isLoading;
			}),
			false,
			'PN/SET_LOADING'
		);
	},
	removePreviewNavigationAttachment: (attachmentId: string): void => {
		set(
			produce((draft: RootStore) => {
				const { active } = draft.previewNavigation;
				if (!active) return;
				const index = active.attachments.findIndex((a) => a.id === attachmentId);
				if (index === -1) return;
				active.attachments.splice(index, 1);
			}),
			false,
			'PN/REMOVE_ATTACHMENT'
		);
	},
	clearPreviewNavigationOpenTarget: (): void => {
		set(
			produce((draft: RootStore) => {
				const { active } = draft.previewNavigation;
				if (!active) return;
				active.openTargetId = undefined;
			}),
			false,
			'PN/CLEAR_OPEN_TARGET'
		);
	},
	clearPreviewNavigation: (): void => {
		set(
			produce((draft: RootStore) => {
				draft.previewNavigation.active = null;
			}),
			false,
			'PN/CLEAR'
		);
	}
});
