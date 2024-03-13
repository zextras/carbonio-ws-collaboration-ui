/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const getNode = jest.fn(() => Promise.resolve({ name: 'root', id: 'ROOT_ID' }));
export const getNodeAvailable = true;
export const filesSelectFilesAction = jest.fn();
export const filesSelectFilesActionAvailable = true;
export const getLink = jest.fn(() => 'link');
export const functionCheck = true;
