/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IEventService } from '../types/network/events/IEventService';

export const mockEventService = {
	connect: vi.fn()
} satisfies IEventService;
