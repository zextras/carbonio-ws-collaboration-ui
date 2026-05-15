/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';

import { XMPPClient } from '../xmpp/XMPPClient';
import { setMessagingServiceRef } from './messagingServiceRef';
import { IMessagingService } from '../../types/network/messaging/IMessagingService';

export const MessagingContext = createContext<IMessagingService | null>(null);

interface MessagingProviderProps {
	children: ReactNode;
}

// TODO: fetch backend feature flag and select the appropriate implementation
export function MessagingProvider({ children }: MessagingProviderProps): React.JSX.Element {
	const service = useMemo<IMessagingService>(() => new XMPPClient(), []);

	useEffect(() => {
		setMessagingServiceRef(service);
	}, [service]);

	return <MessagingContext.Provider value={service}>{children}</MessagingContext.Provider>;
}

export function useMessaging(): IMessagingService {
	const service = useContext(MessagingContext);
	if (!service) throw new Error('useMessaging must be used within MessagingProvider');
	return service;
}
