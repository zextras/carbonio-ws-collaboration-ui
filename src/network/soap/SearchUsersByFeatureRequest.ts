/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { find, map, remove } from 'lodash';

import {
	SearchUsersByFeatureRequest,
	SearchUsersByFeatureResponseType,
	SearchUsersByFeatureSoapResponse
} from '../../types/network/soap/searchUsersByFeatureRequest';
import { isMyId } from '../websocket/eventHandlersUtilities';

export const searchUsersByFeatureRequest = (
	text: string,
	offset = 0
): Promise<SearchUsersByFeatureSoapResponse> =>
	soapFetchV2<
		SearchUsersByFeatureRequest,
		{ SearchUsersByFeatureResponse: SearchUsersByFeatureResponseType }
	>('SearchUsersByFeature', {
		_jsns: 'urn:zimbraAccount',
		name: text,
		feature: 'WSC',
		offset
	})
		.then((rawSoapResponse) => {
			if ('Fault' in rawSoapResponse.Body) {
				throw new Error('Error fetching SearchUsersByFeature results');
			}
			return rawSoapResponse.Body.SearchUsersByFeatureResponse;
		})
		.then((response: SearchUsersByFeatureResponseType) => {
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
			return { contacts: results, more: response.more, total: response.total };
		});
