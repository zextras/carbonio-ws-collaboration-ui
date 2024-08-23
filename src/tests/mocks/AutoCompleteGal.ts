/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContactInfo } from '../../types/network/soap/searchUsersByFeatureRequest';

export const mockedAutoCompleteGalRequest: jest.Mock = jest.fn();
mockedAutoCompleteGalRequest.mockReturnValue([]);

jest.mock('../../network/soap/AutoCompleteRequest', () => ({
	autoCompleteGalRequest: (): Promise<ContactInfo[]> =>
		new Promise((resolve, reject) => {
			const result = mockedAutoCompleteGalRequest();
			result ? resolve(result) : reject(new Error('No results'));
		})
}));
