/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MAX_CHAIN_WAIT_MS, refreshInboxSerialized } from './inboxRefresh';
import { wscSdk } from '../sdk/wscSdk';

describe('refreshInboxSerialized', () => {
	test('a refresh requested while another is in flight starts only after it ends', async () => {
		const resolvers: Array<() => void> = [];
		const spy = vi.spyOn(wscSdk, 'fetchInbox').mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					resolvers.push(resolve);
				})
		);

		const first = refreshInboxSerialized('err');
		const second = refreshInboxSerialized('err');
		expect(spy).toHaveBeenCalledTimes(1);

		resolvers[0]();
		await first;
		await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(2));

		resolvers[1]();
		await second;
	});

	test('a failing refresh is logged and does not block the next one', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const spy = vi
			.spyOn(wscSdk, 'fetchInbox')
			.mockRejectedValueOnce(new Error('down'))
			.mockResolvedValueOnce(undefined);

		await refreshInboxSerialized('failed');
		await refreshInboxSerialized('failed');

		expect(errorSpy).toHaveBeenCalledWith('failed', expect.any(Error));
		expect(spy).toHaveBeenCalledTimes(2);
	});

	test('a hung refresh blocks the next one for at most MAX_CHAIN_WAIT_MS', async () => {
		vi.useFakeTimers();
		const spy = vi
			.spyOn(wscSdk, 'fetchInbox')
			.mockImplementationOnce(() => new Promise<void>(() => {}))
			.mockResolvedValue(undefined);

		refreshInboxSerialized('err');
		const second = refreshInboxSerialized('err');
		await vi.advanceTimersByTimeAsync(MAX_CHAIN_WAIT_MS - 1);
		expect(spy).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		await second;
		expect(spy).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});
});
