/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';
import { map, filter, remove } from 'lodash';

import { ContactInfo } from '../../types/network/soap/searchUsersByFeatureRequest';
import { isMyId } from '../websocket/eventHandlersUtilities';

export const autoCompleteGalRequest = (text: string): Promise<ContactInfo[]> =>
	new Promise<ContactInfo[]>((resolve, reject) => {
		soapFetch<AutoCompleteGalSoapRequest, AutoCompleteGalSoapResponse>('AutoCompleteGal', {
			_jsns: 'urn:zimbraAccount',
			type: 'account',
			name: {
				_content: text
			},
			sortBy: 'nameAsc'
		})
			.then((response: AutoCompleteGalSoapResponse) => {
				const filterUsers = filter(
					response.cn,
					(user) => !!user._attrs.fullName && !user._attrs.type
				);
				const results = map(filterUsers, (user) => ({
					id: user._attrs.zimbraId,
					displayName: user._attrs.fullName,
					email: user._attrs.email
				}));
				remove(results, (user) => isMyId(user.id));
				resolve(results);
			})
			.catch(reject);
	});

export type AutoCompleteGalSoapRequest = {
	_jsns: 'urn:zimbraAccount';
	type: 'account';
	name: { _content: string };
	sortBy: 'nameAsc';
};

export type AutoCompleteGalSoapResponse = {
	cn: { _attrs: ContactMatch }[];
};

export type ContactMatch = {
	email: string;
	firstName: string;
	fullName: string;
	lastName: string;
	zimbraId: string;
	type?: 'group';
};
