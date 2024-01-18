/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import MessageHistoryLoader from './MessageHistoryLoader';
import {
	intersectionObserverMockDisconnect,
	intersectionObserverMockObserve
} from '../../../tests/mocks/global';
import { setup } from '../../../tests/test-utils';

describe('MessageHistoryLoader - IntersectionObserver behaviour', () => {
	test('Intersection observer is created on MessageHistoryLoader mount', () => {
		const ref = React.createRef<HTMLDivElement>();
		setup(
			<>
				<div ref={ref} />
				<MessageHistoryLoader roomId={'roomId'} messageListRef={ref} />
			</>
		);
		expect(intersectionObserverMockObserve).toBeCalledTimes(1);
	});

	test('Intersection observer stops observing on MessageHistoryLoader unmount', () => {
		const ref = React.createRef<HTMLDivElement>();
		const { unmount } = setup(
			<>
				<div ref={ref} />
				<MessageHistoryLoader roomId={'roomId'} messageListRef={ref} />
			</>
		);
		unmount();
		expect(intersectionObserverMockDisconnect).toBeCalledTimes(1);
	});
});
