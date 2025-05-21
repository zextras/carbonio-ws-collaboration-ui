/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { autoCompleteGalRequest } from './AutoCompleteRequest';
import { mockSoapFetch } from '../../../__mocks__/@zextras/carbonio-shell-ui';
import useStore from '../../store/Store';

jest.unmock('./AutoCompleteRequest');

const contact1Match = {
	email: 'contact1@test.com',
	firstName: 'Contact',
	fullName: 'Contact 1',
	lastName: '1',
	zimbraId: '111'
};

const contact2Match = {
	email: 'contact2@test.com',
	firstName: 'Contact',
	fullName: 'Contact 2',
	lastName: '2',
	zimbraId: '222'
};

const contact3Match = {
	email: 'contact3@test.com',
	firstName: 'Contact',
	fullName: 'Contact 3',
	lastName: '3',
	zimbraId: '333'
};

const contact1Info = {
	id: contact1Match.zimbraId,
	displayName: contact1Match.fullName,
	email: contact1Match.email
};

const contact2Info = {
	id: contact2Match.zimbraId,
	displayName: contact2Match.fullName,
	email: contact2Match.email
};

const contact3Info = {
	id: contact3Match.zimbraId,
	displayName: contact3Match.fullName,
	email: contact3Match.email
};

describe('AutoCompleteGalRequest', () => {
	test('Contact info wll be formatted as ContactInfo type', async () => {
		mockSoapFetch.mockResolvedValueOnce({
			cn: [{ _attrs: contact1Match }, { _attrs: contact2Match }, { _attrs: contact3Match }]
		});
		const results = await autoCompleteGalRequest('search text');
		expect(results).toEqual([contact1Info, contact2Info, contact3Info]);
	});

	test('Contact info of the current user will be removed', async () => {
		useStore.getState().setLoginInfo(contact1Info.id, contact1Info.email);
		mockSoapFetch.mockResolvedValueOnce({
			cn: [{ _attrs: contact1Match }, { _attrs: contact2Match }, { _attrs: contact3Match }]
		});
		const results = await autoCompleteGalRequest('search text');
		expect(results).toEqual([contact2Info, contact3Info]);
	});
});
