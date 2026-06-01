/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { configureSharedCode } from './config';

// Setup
export { configureSharedCode };

// Types
export * from './types/store/ActiveConversationTypes';
export * from './types/store/ActiveMeetingTypes';
export * from './types/store/ChatsRegistryTypes';
export * from './types/store/ConnectionsTypes';
export * from './types/store/MediaGalleryTypes';
export * from './types/store/MeetingTypes';
export * from './types/store/PreviewNavigationTypes';
export * from './types/store/RoomTypes';
export * from './types/store/SessionTypes';
export * from './types/store/StoreTypes';
export * from './types/store/UserTypes';

export * from './types/AppEvents';

export * from './types/network/models/attachmentTypes';
export * from './types/network/models/meetingBeTypes';
export * from './types/network/models/roomBeTypes';
export * from './types/network/models/userBeTypes';

export * from './types/websocket/wsEvents';
export * from './types/websocket/wsConversationEvents';
export * from './types/websocket/wsMeetingEvents';

export * from './types/network/webRTC/webRTC';

// Store slices
export * from './store/slices/ActiveConversationsSlice';
export * from './store/slices/ActiveMeetingSlice';
export * from './store/slices/ChatsRegistryStoreSlice';
export * from './store/slices/ConnectionStoreSlice';
export * from './store/slices/MediaGalleryStoreSlice';
export * from './store/slices/MeetingsStoreSlice';
export * from './store/slices/PreviewNavigationStoreSlice';
export * from './store/slices/SessionStoreSlice';
export * from './store/slices/UsersStoreSlice';
export * from './store/slices/RoomsStoreSlice';

// Apis, Soap, WebSocket, WebRTC
export * from './network';

// Utils
export * from './utils/textUtils';
export * from './utils/MeetingsUtils';

// Network types
export * from './types/network/soap/searchUsersByFeatureRequest';
