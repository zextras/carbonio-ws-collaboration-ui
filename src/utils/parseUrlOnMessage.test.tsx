/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ReactElement } from 'react';

import { render, screen } from '@testing-library/react';
import { isElement, isElementOfType } from 'react-dom/test-utils';

import { parseUrlOnMessage } from './parseUrlOnMessage';

describe('Parse simple text messages', () => {
	const url = 'www.test.com';
	const httpUrl = 'http://www.test.com';
	const httpsUrl = 'https://www.test.com';
	const text = ' Test of test ';
	const emoji = '😔';

	it('Render anchor element', () => {
		// Render 'www.test.com'
		const formattedText = parseUrlOnMessage(`${url}`);
		expect(formattedText).toHaveLength(1);
		render(formattedText[0] as ReactElement);
		const anchorElement = screen.getByText(url);
		expect(anchorElement).toHaveAttribute('href', `http://${url}`);

		// Render 'http://www.test.com
		const httpFormattedText = parseUrlOnMessage(`${httpUrl}`);
		expect(httpFormattedText).toHaveLength(1);
		render(httpFormattedText[0] as ReactElement);
		const httpAnchorElement = screen.getByText(httpUrl);
		expect(httpAnchorElement).toHaveAttribute('href', httpUrl);

		// Render 'https://www.test.com
		const httpsFormattedText = parseUrlOnMessage(`${httpsUrl}`);
		expect(httpsFormattedText).toHaveLength(1);
		render(httpsFormattedText[0] as ReactElement);
		const httpsAnchorElement = screen.getByText(httpsUrl);
		expect(httpsAnchorElement).toHaveAttribute('href', httpsUrl);
	});

	it('Text message', () => {
		// Test ' Test of test '
		const formattedText = parseUrlOnMessage(`${text}`);
		expect(formattedText).toHaveLength(1);
		expect(formattedText[0]).toBe(text);
	});

	it('Url message', () => {
		// Test 'www.test.com'
		const formattedText = parseUrlOnMessage(`${url}`);
		expect(formattedText).toHaveLength(1);
		const anchorElement = formattedText[0] as ReactElement;
		expect(isElement(anchorElement)).toBeTruthy();

		// Test 'http://www.test.com'
		const httpFormattedText = parseUrlOnMessage(`${httpUrl}`);
		expect(httpFormattedText).toHaveLength(1);
		const httpAnchorElement = httpFormattedText[0] as ReactElement;
		expect(isElementOfType(httpAnchorElement, 'a')).toBeTruthy();

		// Test 'https://www.test.com'
		const httpsFormattedText = parseUrlOnMessage(`${httpsUrl}`);
		expect(httpsFormattedText).toHaveLength(1);
		const httpsAnchorElement = httpsFormattedText[0] as ReactElement;
		expect(isElementOfType(httpsAnchorElement, 'a')).toBeTruthy();
	});

	it('Emoji message', () => {
		const formattedText = parseUrlOnMessage(`${emoji}`);
		expect(formattedText).toHaveLength(1);
		expect(formattedText[0]).toBe(emoji);
	});
});

describe('Parse combined text messages', () => {
	const url = 'www.test.com';
	const httpUrl = 'http://www.test.com';
	const httpsUrl = 'https://www.test.com';
	const text = ' Test of test ';
	const emoji = '😔';

	it('Combinations of text and url message', () => {
		// Test ' Test of test www.test.com'
		const formattedText = parseUrlOnMessage(`${text}${url}`);
		expect(formattedText).toHaveLength(2);
		expect(formattedText[0]).toBe(text);
		expect(isElement(formattedText[1])).toBeTruthy();

		// Test 'www.test.com Test of test '
		const formattedText1 = parseUrlOnMessage(`${url}${text}`);
		expect(formattedText1).toHaveLength(2);
		expect(isElement(formattedText1[0])).toBeTruthy();
		expect(formattedText1[1]).toBe(text);

		// Test 'www.test.com Test of test https://www.test.com'
		const formattedText2 = parseUrlOnMessage(`${url}${text}${httpsUrl}`);
		expect(formattedText2).toHaveLength(3);
		expect(isElement(formattedText2[0])).toBeTruthy();
		expect(formattedText2[1]).toBe(text);
		expect(isElement(formattedText2[2])).toBeTruthy();

		// Test ' Test of test https://www.test.com Test of test www.test.com www.test.com'
		const formattedText3 = parseUrlOnMessage(`${text}${httpUrl}${text}${url} ${url}`);
		expect(formattedText3).toHaveLength(6);
		expect(formattedText3[0]).toBe(text);
		expect(isElement(formattedText3[1])).toBeTruthy();
		expect(formattedText3[2]).toBe(text);
		expect(isElement(formattedText3[3])).toBeTruthy();
		expect(formattedText3[4]).toBe(' ');
		expect(isElement(formattedText3[5])).toBeTruthy();
	});

	it('Combinations of text, url and emoji message', () => {
		// Test '😔www.test.com'
		const formattedText = parseUrlOnMessage(`${emoji}${url}`);
		expect(formattedText).toHaveLength(2);
		expect(formattedText[0]).toBe(emoji);
		expect(isElement(formattedText[1])).toBeTruthy();

		// Test ' Test of test www.test.com 😔'
		const formattedText1 = parseUrlOnMessage(`${text}${url} ${emoji}`);
		expect(formattedText1).toHaveLength(3);
		expect(formattedText1[0]).toBe(text);
		expect(isElement(formattedText1[1])).toBeTruthy();
		expect(formattedText1[2]).toBe(` ${emoji}`);

		// Test ' Test of test www.test.com 😔😔😔😔'
		const formattedText2 = parseUrlOnMessage(`${text}${url} ${emoji}${emoji}${emoji}${emoji}`);
		expect(formattedText2).toHaveLength(3);
		expect(formattedText2[0]).toBe(text);
		expect(isElement(formattedText2[1])).toBeTruthy();
		expect(formattedText2[2]).toBe(` ${emoji}${emoji}${emoji}${emoji}`);

		// Test '😔 https://www.test.com 😔'
		const formattedText3 = parseUrlOnMessage(`${emoji} ${httpsUrl} ${emoji}`);
		expect(formattedText3).toHaveLength(3);
		expect(formattedText3[0]).toBe(`${emoji} `);
		expect(isElement(formattedText3[1])).toBeTruthy();
		expect(formattedText3[2]).toBe(` ${emoji}`);
	});
});
