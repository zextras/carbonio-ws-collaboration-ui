/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import TextContentBubble from './TextContentBubble';
import { setup } from '../../../../tests/test-utils';

const biggerFontSize = `font-size: 3rem`;

describe('TextContentBubble', () => {
	test('Text is composed only by characters and renders correctly', () => {
		const textContent = 'Hello world';
		setup(<TextContentBubble textContent={textContent} />);
		expect(screen.getByText(textContent)).toBeVisible();
	});

	test('Text is composed by characters and emojis and renders without emoji enlargement', () => {
		const textContent = 'Hello 😀';
		setup(<TextContentBubble textContent={textContent} />);
		expect(screen.getByText(textContent)).toBeVisible();
	});

	test('Text is composed by one emoji and its dimension is bigger', () => {
		const textContent = '😀';
		setup(<TextContentBubble textContent={textContent} />);
		const text = screen.getByText(textContent);
		expect(text).toHaveStyle(biggerFontSize);
	});

	test('Text is composed by three emoji and its dimension is bigger', () => {
		const textContent = '😀😀😀';
		setup(<TextContentBubble textContent={textContent} />);
		const text = screen.getByText(textContent);
		expect(text).toHaveStyle(biggerFontSize);
	});

	test('Text is composed by four emoji and renders without emoji enlargement', () => {
		const textContent = '😀😀😀😀';
		setup(<TextContentBubble textContent={textContent} />);
		expect(screen.getByText(textContent)).toBeVisible();
	});

	test('Text is composed by emoji and a lot of spaces and its dimension is bigger', () => {
		const textContent = '😀    😀';
		setup(<TextContentBubble textContent={textContent} />);
		const text = screen.getByText(/😀/);
		expect(text).toHaveStyle(biggerFontSize);
	});

	test('Text is composed by emoji and new lines and its dimension is bigger', () => {
		const textContent = '😀\n\n😀';
		setup(<TextContentBubble textContent={textContent} />);
		const text = screen.getByText(/😀/);
		expect(text).toHaveStyle(biggerFontSize);
	});

	test('Text is composed by numbers and renders correctly', () => {
		const textContent = '12';
		setup(<TextContentBubble textContent={textContent} />);
		expect(screen.getByText(textContent)).toBeVisible();
	});
});
