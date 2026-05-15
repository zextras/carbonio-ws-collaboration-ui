/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';

import { meetingsApiHttp } from './meetingsApiHttp';
import { setMeetingsApiRef } from './meetingsApiRef';
import { IMeetingsApi } from '../../types/network/apis/IMeetingsApi';

export const MeetingsApiContext = createContext<IMeetingsApi | null>(null);

interface MeetingsApiProviderProps {
	children: ReactNode;
}

export function MeetingsApiProvider({ children }: MeetingsApiProviderProps): React.JSX.Element {
	const api = useMemo<IMeetingsApi>(() => meetingsApiHttp, []);

	useEffect(() => {
		setMeetingsApiRef(api);
	}, [api]);

	return <MeetingsApiContext.Provider value={api}>{children}</MeetingsApiContext.Provider>;
}

export function useMeetingsApi(): IMeetingsApi {
	const api = useContext(MeetingsApiContext);
	if (!api) throw new Error('useMeetingsApi must be used within MeetingsApiProvider');
	return api;
}
