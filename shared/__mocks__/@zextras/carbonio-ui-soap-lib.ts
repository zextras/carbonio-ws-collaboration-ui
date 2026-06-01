/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RawSoapResponse } from '@zextras/carbonio-ui-soap-lib';

export const mockSoapFetchV2 = vi.fn();

export const soapFetchV2 = (): Promise<RawSoapResponse<Record<string, unknown>>> =>
	new Promise((resolve, reject) => {
		const result = mockSoapFetchV2();
		result
			? resolve({ Body: result, Header: { context: {} } })
			: reject(new Error('no result provided'));
	});
