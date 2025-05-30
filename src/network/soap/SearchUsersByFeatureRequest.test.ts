/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { searchUsersByFeatureRequest } from './SearchUsersByFeatureRequest';
import { mockSoapFetch } from '../../../__mocks__/@zextras/carbonio-shell-ui';
import useStore from '../../store/Store';

jest.unmock('./SearchUsersByFeatureRequest');

const contact1Match = {
	a: [
		{ n: 'displayName', _content: 'Contact 1' },
		{ n: 'email', _content: 'contact1@test.com' }
	],
	id: '111',
	name: 'Contact 1'
};

const contact2Match = {
	a: [
		{ n: 'displayName', _content: 'Contact 2' },
		{ n: 'email', _content: 'contact2@test.com' }
	],
	id: '222',
	name: 'Contact 2'
};

const contact3Match = {
	a: [
		{ n: 'displayName', _content: 'Contact 3' },
		{ n: 'email', _content: 'contact3@tesst.com' }
	],
	id: '333',
	name: 'Contact 3'
};

const contact1Info = {
	id: contact1Match.id,
	displayName: contact1Match.a[0]._content,
	email: contact1Match.a[1]._content
};

const contact2Info = {
	id: contact2Match.id,
	displayName: contact2Match.a[0]._content,
	email: contact2Match.a[1]._content
};

const contact3Info = {
	id: contact3Match.id,
	displayName: contact3Match.a[0]._content,
	email: contact3Match.a[1]._content
};

const contact1MatchAutoComplete = {
	email: contact1Match.a[1]._content,
	fullName: contact1Match.name,
	zimbraId: contact1Match.id
};

const contact2MatchAutoComplete = {
	email: contact2Match.a[1]._content,
	fullName: contact2Match.name,
	zimbraId: contact2Match.id
};

const contact3MatchAutoComplete = {
	email: contact3Match.a[1]._content,
	fullName: contact3Match.name,
	zimbraId: contact3Match.id
};

describe('SearchUsersByFeatureRequest', () => {
	test('Contact info wll be formatted as ContactInfo type', async () => {
		mockSoapFetch.mockResolvedValueOnce({
			account: [contact1Match, contact2Match, contact3Match],
			more: true
		});
		const { contacts, more } = await searchUsersByFeatureRequest('');
		expect(contacts).toEqual([contact1Info, contact2Info, contact3Info]);
		expect(more).toBeTruthy();
	});

	test('Contact info of the current user will be removed', async () => {
		useStore.getState().setLoginInfo(contact1Info.id, contact1Info.email);
		mockSoapFetch.mockResolvedValueOnce({
			account: [contact1Match, contact2Match, contact3Match],
			more: false
		});
		const { contacts, more } = await searchUsersByFeatureRequest('search text');
		expect(contacts).toEqual([contact2Info, contact3Info]);
		expect(more).toBeFalsy();
	});

	test('If the request fails, it will fallback to autoCompleteGalRequest', async () => {
		useStore.getState().setLoginInfo(contact3Info.id, contact3Info.email);
		mockSoapFetch.mockResolvedValueOnce({
			Fault: { Detail: { Error: { Code: 'service.UNKNOWN_DOCUMENT' } } }
		});
		mockSoapFetch.mockResolvedValueOnce({
			cn: [
				{ _attrs: contact1MatchAutoComplete },
				{ _attrs: contact2MatchAutoComplete },
				{ _attrs: contact3MatchAutoComplete }
			]
		});
		const { contacts, more, total } = await searchUsersByFeatureRequest('search text');
		expect(contacts).toEqual([contact1Info, contact2Info]);
		expect(more).toBeFalsy();
		expect(total).toBe(2);
	});
});
