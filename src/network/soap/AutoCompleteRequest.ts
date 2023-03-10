/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';
import { map, filter } from 'lodash';

export const autoCompleteGalRequest = (text: string): Promise<AutoCompleteGalResponse> =>
	new Promise<AutoCompleteGalResponse>((resolve, reject) => {
		soapFetch<AutoCompleteGalSoapRequest, AutoCompleteGalSoapResponse>('AutoCompleteGal', {
			_jsns: 'urn:zimbraAccount',
			type: 'account',
			name: {
				_content: text
			},
			sortBy: 'nameAsc'
		})
			.then((response: AutoCompleteGalSoapResponse) => {
				const filterUsers = filter(response.cn, (user) => !!user._attrs.fullName);
				const zimbraUsers = map(filterUsers, (user) => ({
					email: user._attrs.email,
					firstName: user._attrs.firstName,
					fullName: user._attrs.fullName,
					lastName: user._attrs.lastName,
					zimbraId: user._attrs.zimbraId
				}));
				resolve(zimbraUsers);
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

export type AutoCompleteGalResponse = ContactMatch[];

export type ContactMatch = {
	email: string;
	firstName: string;
	fullName: string;
	lastName: string;
	zimbraId: string;
};
