/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen } from '@testing-library/react';

import ConversationFooter from './ConversationFooter';
import { wscSdk } from '../../../../network/sdk/wscSdk';
import useStore from '../../../../store/Store';
import { createMockRoom } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { mockSendAttachmentFetchAPI } from '../../../../utils/__mocks__/FetchUtils';

vi.mock('../../../../utils/FetchUtils');

const roomId = 'room-chain';
const pdf = 'application/pdf';

const attemptsOf = (): Array<string> =>
	mockSendAttachmentFetchAPI.mock.calls.map((call) => (call[1] as File).name);

const failWith = (names: Record<string, unknown>): void => {
	mockSendAttachmentFetchAPI.mockImplementation((endpoint: string, file: File) =>
		file.name in names ? Promise.reject(names[file.name]) : Promise.resolve({})
	);
};

const sendTwoFiles = async (): Promise<void> => {
	setup(<ConversationFooter roomId={roomId} />);
	const input = screen.getByTestId('inputSelector') as HTMLInputElement;
	fireEvent.change(input, {
		target: {
			files: [
				new File(['a'], 'first.pdf', { type: pdf }),
				new File(['b'], 'second.pdf', { type: pdf })
			]
		}
	});
	fireEvent.click(screen.getByTestId('icon: Navigation2'));
	await act(() => vi.advanceTimersByTimeAsync(1000));
};

describe('Composer upload chain on the real SDK', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().addRooms([createMockRoom({ id: roomId })]);
	});

	afterEach(() => {
		wscSdk.reset();
		vi.useRealTimers();
		mockSendAttachmentFetchAPI.mockReset().mockImplementation(() => Promise.resolve({}));
	});

	test('A certain rejection of the first file stops the second one', async () => {
		failWith({ 'first.pdf': Object.assign(new Error('status ko'), { status: 403 }) });

		await sendTwoFiles();

		expect(attemptsOf()).toEqual(['first.pdf']);
	});

	test('An uncertain first attempt releases the second file without waiting for the retries', async () => {
		failWith({ 'first.pdf': new Error('offline') });

		await sendTwoFiles();

		expect(attemptsOf()).toEqual(['first.pdf', 'second.pdf']);
	});
});
