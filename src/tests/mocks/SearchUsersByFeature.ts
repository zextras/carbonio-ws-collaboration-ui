/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import mockLodash from 'lodash';

import { isMyId as mockIsMyId } from '../../network/websocket/eventHandlersUtilities';
import {
	ContactInfo,
	SearchUsersByFeatureSoapResponse
} from '../../types/network/soap/searchUsersByFeatureRequest';

export const mockSearchUsersByFeatureRequest: jest.Mock = jest.fn();
mockSearchUsersByFeatureRequest.mockReturnValue([]);

jest.mock('../../network/soap/SearchUsersByFeatureRequest', () => ({
	searchUsersByFeatureRequest: (): Promise<SearchUsersByFeatureSoapResponse> =>
		new Promise((resolve, reject) => {
			const result = mockSearchUsersByFeatureRequest();
			mockLodash.remove(result, (user: ContactInfo) => mockIsMyId(user.id));
			result ? resolve(result) : reject(new Error('No results'));
		})
}));
