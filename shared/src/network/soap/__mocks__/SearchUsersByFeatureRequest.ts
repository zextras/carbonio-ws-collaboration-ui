/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import mockLodash from 'lodash';
import type { Mock } from 'vitest';

import { sharedConfig } from '../../../config';
import {
	ContactInfo,
	SearchUsersByFeatureSoapResponse
} from '../../../types/network/soap/searchUsersByFeatureRequest';

export const mockSearchUsersByFeatureRequest: Mock = vi.fn();

export const searchUsersByFeatureRequest: () => Promise<SearchUsersByFeatureSoapResponse> = () =>
	new Promise((resolve, reject) => {
		const result = mockSearchUsersByFeatureRequest();
		mockLodash.remove(result, (user: ContactInfo) => user.id === sharedConfig.useStore.getState().session.id);
		result ? resolve(result) : reject(new Error('No results'));
	});
