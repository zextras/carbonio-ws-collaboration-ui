/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fetchAPI, RequestType } from '../../utils/FetchUtils';

export const getLicense = (): Promise<{ licensed: boolean }> =>
	fetchAPI(`license`, RequestType.GET);

export const getToken = (): Promise<{ zmToken: string }> => fetchAPI(`auth/token`, RequestType.GET);
