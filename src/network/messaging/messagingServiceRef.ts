/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IMessagingService } from '../../types/network/messaging/IMessagingService';

// Holds a reference to the active IMessagingService for use in non-React contexts
// (e.g. WebSocket event handlers) that cannot access the React context directly.
// Will be replaced by proper injection when the WebSocket layer is refactored.
let serviceRef: IMessagingService | null = null;

export function setMessagingServiceRef(service: IMessagingService): void {
	serviceRef = service;
}

export function getMessagingService(): IMessagingService {
	if (!serviceRef) throw new Error('MessagingService not initialized');
	return serviceRef;
}
