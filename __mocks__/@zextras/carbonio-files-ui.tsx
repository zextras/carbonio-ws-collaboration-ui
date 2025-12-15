/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const getNode = vi.fn(() => Promise.resolve({ name: 'root', id: 'ROOT_ID' }));
export const getNodeAvailable = true;
export const filesSelectFilesAction = vi.fn();
export const filesSelectFilesActionAvailable = true;
export const getLink = vi.fn(() => 'link');
export const functionCheck = true;
