/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';
import { find, map, remove } from 'lodash';

import { autoCompleteGalRequest } from './AutoCompleteRequest';
import {
	SearchUsersByFeatureRequest,
	SearchUsersByFeatureResponse,
	SearchUsersByFeatureSoapResponse
} from '../../types/network/soap/searchUsersByFeatureRequest';
import { isMyId } from '../websocket/eventHandlersUtilities';

export const searchUsersByFeatureRequest = (
	text: string
): Promise<SearchUsersByFeatureSoapResponse> =>
	soapFetch<SearchUsersByFeatureRequest, SearchUsersByFeatureResponse>('SearchUsersByFeature', {
		_jsns: 'urn:zimbraAccount',
		name: text,
		feature: 'CHATS'
	}).then((response: SearchUsersByFeatureResponse) => {
		if (response.account) {
			const results = map(response.account, (user) => {
				const displayName = find(user.a, (attr) => attr.n === 'displayName')?._content;
				const email = find(user.a, (attr) => attr.n === 'email')?._content;
				return {
					id: user.id,
					displayName: displayName ?? user.name,
					email: email ?? user.name
				};
			});
			remove(results, (user) => isMyId(user.id));
			return results;
		}
		return autoCompleteGalRequest(text);
	});
