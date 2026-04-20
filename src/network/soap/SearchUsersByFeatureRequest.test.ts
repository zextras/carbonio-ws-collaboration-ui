/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { searchUsersByFeatureRequest } from './SearchUsersByFeatureRequest';
import { mockSoapFetchV2 } from '../../../__mocks__/@zextras/carbonio-ui-soap-lib';
import useStore from '../../store/Store';

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

vi.mock('@zextras/carbonio-ui-soap-lib');

describe('SearchUsersByFeatureRequest', () => {
	test('Contact info wll be formatted as ContactInfo type', async () => {
		mockSoapFetchV2.mockReturnValueOnce({
			SearchUsersByFeatureResponse: {
				account: [contact1Match, contact2Match, contact3Match],
				more: true
			}
		});
		const { contacts, more } = await searchUsersByFeatureRequest('');
		expect(contacts).toEqual([contact1Info, contact2Info, contact3Info]);
		expect(more).toBeTruthy();
	});

	test('Contact info of the current user will be removed', async () => {
		useStore.getState().setLoginInfo({ id: contact1Info.id });
		mockSoapFetchV2.mockReturnValueOnce({
			SearchUsersByFeatureResponse: {
				account: [contact1Match, contact2Match, contact3Match],
				more: false
			}
		});
		const { contacts, more } = await searchUsersByFeatureRequest('search text');
		expect(contacts).toEqual([contact2Info, contact3Info]);
		expect(more).toBeFalsy();
	});

	test('SearchUsersByFeatureRequest should throw an error on failure', async () => {
		mockSoapFetchV2.mockReturnValueOnce({
			Fault: { Code: 'some error code', Detail: 'some error detail' }
		});
		await expect(searchUsersByFeatureRequest('search text')).rejects.toThrow(
			'Error fetching SearchUsersByFeature results'
		);
	});
});
