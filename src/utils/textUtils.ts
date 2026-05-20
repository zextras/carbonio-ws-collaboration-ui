/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';

// Encode a string into a string full of unicode characters
export const charToUnicode = (text: string): string => {
	let unicodeString = '';
	forEach(text, (value, key) => {
		const charCode = text.charCodeAt(key);
		const unicodeChar = `\\u${charCode.toString(16).padStart(4, '0')}`;
		unicodeString += unicodeChar;
	});
	return unicodeString;
};

// Decode a string full of unicode characters into a string with the actual characters
export const unicodeToChar = (text: string): string =>
	text.replace(/\\u[\dA-F]{4}/gi, (match) =>
		String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
	);
