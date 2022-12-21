/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable max-len, no-cond-assign */

import React, { ReactElement } from 'react';

type ParseUrlOnMessageReturnType = (string | ReactElement)[];

// Function to transform a simple text message with URLs in an array of component with anchor tags
export function parseUrlOnMessage(messageText: string): ParseUrlOnMessageReturnType {
	const URLRegExp =
		/https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/;
	const globalURLRegExp = new RegExp(URLRegExp.source, 'g');

	let match;
	const messageArray = [];
	let startIndex = 0;

	while ((match = globalURLRegExp.exec(messageText)) != null) {
		const str = messageText.substring(startIndex, match.index);
		if (str.length > 0) {
			messageArray.push(str);
		}

		if (URLRegExp.test(match[0])) {
			const anchorElement = React.createElement(
				'a',
				{
					href: /https?:\/\//.test(match[0]) ? match[0] : `http://${match[0]}`,
					target: '_blank',
					rel: 'noopener noreferrer',
					key: match.index + str
				},
				match[0]
			);
			messageArray.push(anchorElement);
		}

		startIndex = globalURLRegExp.lastIndex;
	}

	if (messageText.substring(startIndex).length > 0) {
		messageArray.push(messageText.substring(startIndex));
	}

	return messageArray;
}
