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
	DEFAULT_MEDIA_GALLERY_FILTER,
	MediaGalleryFilter,
	MediaGalleryRoomState,
	MediaGalleryStoreSlice
} from '../../types/store/MediaGalleryTypes';
import { RootStore } from '../../types/store/StoreTypes';

const isSameFilter = (a: MediaGalleryFilter, b: MediaGalleryFilter): boolean =>
	a.userId === b.userId && a.sortBy === b.sortBy && a.order === b.order;

const initMediaGalleryRoom = (draft: RootStore, roomId: string): MediaGalleryRoomState => {
	if (!draft.mediaGallery[roomId]) {
		draft.mediaGallery[roomId] = {
			attachments: [],
			nextCursor: undefined,
			hasMore: true,
			isLoading: false,
			isInitialized: false,
			filter: DEFAULT_MEDIA_GALLERY_FILTER
		};
	}
	return draft.mediaGallery[roomId];
};

export const useMediaGalleryStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	MediaGalleryStoreSlice
> = (set) => ({
	mediaGallery: {},
	setMediaGalleryLoading: (roomId: string, isLoading: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const state = initMediaGalleryRoom(draft, roomId);
				if (state.isLoading === isLoading) return;
				state.isLoading = isLoading;
			}),
			false,
			'MG/SET_LOADING'
		);
	},
	appendMediaGalleryPage: (
		roomId: string,
		attachments: Array<Attachment>,
		nextCursor: string | undefined
	): void => {
		set(
			produce((draft: RootStore) => {
				const state = initMediaGalleryRoom(draft, roomId);
				state.attachments.push(...attachments);
				state.nextCursor = nextCursor;
				state.hasMore = nextCursor !== undefined;
				state.isInitialized = true;
				state.isLoading = false;
			}),
			false,
			'MG/APPEND_PAGE'
		);
	},
	setMediaGalleryFilter: (roomId: string, filter: MediaGalleryFilter): void => {
		set(
			produce((draft: RootStore) => {
				const state = initMediaGalleryRoom(draft, roomId);
				if (isSameFilter(state.filter, filter)) return;
				state.filter = filter;
				state.attachments = [];
				state.nextCursor = undefined;
				state.hasMore = true;
				state.isInitialized = false;
				state.isLoading = false;
			}),
			false,
			'MG/SET_FILTER'
		);
	}
});
