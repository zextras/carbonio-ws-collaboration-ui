/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IEventService } from '../../types/network/events/IEventService';

let serviceRef: IEventService | null = null;

export function setEventServiceRef(service: IEventService): void {
	serviceRef = service;
}

export function getEventService(): IEventService {
	if (!serviceRef) throw new Error('EventService not initialized');
	return serviceRef;
}
