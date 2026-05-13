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
				state.filter = filter;
			}),
			false,
			'MG/SET_FILTER'
		);
	},
	removeMediaGalleryAttachment: (roomId: string, attachmentId: string): void => {
		set(
			produce((draft: RootStore) => {
				const state = draft.mediaGallery[roomId];
				if (!state) return;
				const index = state.attachments.findIndex((a) => a.id === attachmentId);
				if (index === -1) return;
				state.attachments.splice(index, 1);
			}),
			false,
			'MG/REMOVE_ATTACHMENT'
		);
	},
	prependMediaGalleryAttachment: (roomId: string, attachment: Attachment): void => {
		set(
			produce((draft: RootStore) => {
				const state = draft.mediaGallery[roomId];
				if (!state?.isInitialized) return;
				if (state.attachments.some((a) => a.id === attachment.id)) return;
				state.attachments.unshift(attachment);
			}),
			false,
			'MG/PREPEND_ATTACHMENT'
		);
	}
});
