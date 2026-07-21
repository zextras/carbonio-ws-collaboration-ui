/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sharedConfig } from '../../config';
import { RequestType } from '../../types/network/fetch';
import { AttributesList } from '../../types/store/SessionTypes';

export const getLicense = (): Promise<{ licensed: boolean }> =>
	sharedConfig.fetchAPI(`license`, RequestType.GET);

export const getToken = (): Promise<{ zmToken: string }> =>
	sharedConfig.fetchAPI(`auth/token`, RequestType.GET);

export const getCapabilities = (): Promise<AttributesList> =>
	sharedConfig.fetchAPI<AttributesList>('users/capabilities', RequestType.GET).then((resp) => {
		sharedConfig.useStore.getState().setCapabilities(resp);
		return resp;
	});
