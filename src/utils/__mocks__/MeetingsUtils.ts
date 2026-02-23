/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export * from '../MeetingsUtils';

export const getWorkerUrl = vi.fn(() => new URL('blob:http://localhost/mock-worker'));
