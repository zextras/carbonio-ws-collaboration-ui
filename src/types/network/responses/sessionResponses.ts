/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CapabilityList } from '../../store/SessionTypes';

export type GetTokenResponse = {
	zmToken: string;
};

export type GetCapabilitiesResponse = CapabilityList;
