/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ActiveConversationsSlice } from './ActiveConversationTypes';
import { ActiveMeetingSlice } from './ActiveMeetingTypes';
import { ChatsRegistryStoreSlice } from './ChatsRegistryTypes';
import { ConnectionsStoreSlice } from './ConnectionsTypes';
import { MediaGalleryStoreSlice } from './MediaGalleryTypes';
import { MeetingsSlice } from './MeetingTypes';
import { PreviewNavigationStoreSlice } from './PreviewNavigationTypes';
import { RoomsStoreSlice } from './RoomTypes';
import { SessionStoreSlice } from './SessionTypes';
import { UsersStoreSlice } from './UserTypes';

export type RootStore = UsersStoreSlice &
	RoomsStoreSlice &
	SessionStoreSlice &
	ActiveConversationsSlice &
	ChatsRegistryStoreSlice &
	ConnectionsStoreSlice &
	MeetingsSlice &
	ActiveMeetingSlice &
	MediaGalleryStoreSlice &
	PreviewNavigationStoreSlice;
