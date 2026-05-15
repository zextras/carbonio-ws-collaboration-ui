/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';

import { setEventServiceRef } from './eventServiceRef';
import { WebSocketClient } from '../websocket/WebSocketClient';
import { IEventService } from '../../types/network/events/IEventService';

export const EventsContext = createContext<IEventService | null>(null);

interface EventsProviderProps {
	children: ReactNode;
}

export function EventsProvider({ children }: EventsProviderProps): React.JSX.Element {
	const service = useMemo<IEventService>(() => new WebSocketClient(), []);

	useEffect(() => {
		setEventServiceRef(service);
	}, [service]);

	return <EventsContext.Provider value={service}>{children}</EventsContext.Provider>;
}

export function useEvents(): IEventService {
	const service = useContext(EventsContext);
	if (!service) throw new Error('useEvents must be used within EventsProvider');
	return service;
}
