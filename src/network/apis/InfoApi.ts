/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { AttributesList } from '../../types/store/SessionTypes';
import { fetchAPI, RequestType } from '../../utils/FetchUtils';

export const getLicense = (): Promise<{ licensed: boolean }> =>
	fetchAPI(`license`, RequestType.GET);

export const getToken = (): Promise<{ zmToken: string }> => fetchAPI(`auth/token`, RequestType.GET);

export const getCapabilities = (): Promise<AttributesList> =>
	fetchAPI<AttributesList>('users/capabilities', RequestType.GET).then((resp) => {
		useStore.getState().setCapabilities(resp);
		return resp;
	});
