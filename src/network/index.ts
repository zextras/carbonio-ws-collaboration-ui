/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Named function APIs
export * from './apis/InfoApi';
export * from './apis/MeetingsApi';
export * from './apis/AttachmentsApi';
export * from './apis/RoomsApi';
export * from './apis/UsersApi';

// ChatApi singleton — still a class
export { default as ChatApi } from './apis/ChatApi';

// Compatibility shims: components and network internals still reference
// RoomsApi.method() and UsersApi.method() from previous common-socket refactoring.
// These re-export the named functions as namespaced objects so those call sites
// continue to work without modification.
export { default as RoomsApi } from './apis/RoomsApi';
export { default as UsersApi } from './apis/UsersApi';
