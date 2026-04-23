/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Named function APIs — same pattern as devel
export * from './apis/InfoApi';
export * from './apis/MeetingsApi';
export * from './apis/AttachmentsApi';

// Singleton class APIs — common-socket refactoring
export { default as RoomsApi } from './apis/RoomsApi';
export { default as UsersApi } from './apis/UsersApi';
export { default as ChatApi } from './apis/ChatApi';
