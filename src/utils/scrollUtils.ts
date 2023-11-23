/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RefObject } from 'react';

export const scrollToEnd = (element?: RefObject<HTMLDivElement>): void =>
	element?.current?.scrollTo({
		top: element.current.scrollHeight,
		behavior: 'auto'
	});

export const scrollToMessage = (messageId?: string): void => {
	if (messageId) {
		const message = window.document.getElementById(`message-${messageId}`);
		message?.scrollIntoView({ block: 'end' });
	}
};
