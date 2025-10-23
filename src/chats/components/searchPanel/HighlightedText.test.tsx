/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import HighlightedText from './HighlightedText';
import { setup } from '../../../tests/test-utils';

describe('HighlightedText', () => {
	const text = 'Hello world';
	const highlightedColor = 'color: #2b73d2';
	test('should render plain text when searchText is empty', () => {
		setup(<HighlightedText text={text} searchText="" />);
		expect(screen.getByText(text)).toBeVisible();
	});

	test('should render plain text when searchText contains only spaces', () => {
		setup(<HighlightedText text="Hello world" searchText="   " />);
		expect(screen.getByText(text)).toBeVisible();
	});

	test('should highlight single word match', () => {
		const { container } = setup(<HighlightedText text={text} searchText="world" />);
		const highlighted = container.querySelector('span');
		expect(highlighted).toBeVisible();
		expect(highlighted).toHaveTextContent('world');
		expect(highlighted).toHaveStyle(highlightedColor);
	});

	test('should highlight multiple occurrences of the same word', () => {
		const { container } = setup(
			<HighlightedText text="Hello world, world is beautiful" searchText="world" />
		);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted).toHaveLength(2);
		expect(highlighted[0]).toHaveTextContent('world');
		expect(highlighted[0]).toHaveStyle(highlightedColor);
		expect(highlighted[1]).toHaveTextContent('world');
		expect(highlighted[1]).toHaveStyle(highlightedColor);
	});

	test('should highlight multiple different words', () => {
		const { container } = setup(
			<HighlightedText text="Hello world, this is a test" searchText="Hello test" />
		);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted).toHaveLength(2);
		expect(highlighted[0]).toHaveTextContent('Hello');
		expect(highlighted[0]).toHaveStyle(highlightedColor);
		expect(highlighted[1]).toHaveTextContent('test');
		expect(highlighted[1]).toHaveStyle(highlightedColor);
	});

	test('should be case insensitive', () => {
		const { container } = setup(<HighlightedText text="Hello World" searchText="hello WORLD" />);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted).toHaveLength(2);
		expect(highlighted[0]).toHaveTextContent('Hello');
		expect(highlighted[0]).toHaveStyle(highlightedColor);
		expect(highlighted[1]).toHaveTextContent('World');
		expect(highlighted[1]).toHaveStyle(highlightedColor);
	});

	test('should handle special regex characters in searchText', () => {
		const { container } = setup(
			<HighlightedText text="Price is $100 (approx.)" searchText="$100 (approx.)" />
		);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted.length).toBeGreaterThan(0);
		expect(screen.getByText('$100')).toBeVisible();
	});

	test('should handle multiple spaces in searchText', () => {
		const { container } = setup(
			<HighlightedText text="Hello world test" searchText="Hello    test" />
		);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted).toHaveLength(2);
		expect(highlighted[0]).toHaveTextContent('Hello');
		expect(highlighted[1]).toHaveTextContent('test');
	});

	test('should not highlight when no matches found', () => {
		const { container } = setup(<HighlightedText text="Hello world" searchText="xyz" />);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted).toHaveLength(0);
		expect(screen.getByText('Hello world')).toBeVisible();
	});

	test('should handle partial word matches', () => {
		const { container } = setup(<HighlightedText text="Hello world" searchText="ell" />);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted).toHaveLength(1);
		expect(highlighted[0]).toHaveTextContent('ell');
	});

	test('should preserve text formatting with line breaks', () => {
		const textWithBreaks = 'Hello\nWorld\nTest';
		setup(<HighlightedText text={textWithBreaks} searchText="World" />);

		expect(screen.getByText(/Hello/)).toBeVisible();
		expect(screen.getByText('World')).toBeVisible();
	});

	test('should handle empty text', () => {
		const { container } = setup(<HighlightedText text="" searchText="test" />);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted).toHaveLength(0);
	});

	test('should trim search text before processing', () => {
		const { container } = setup(
			<HighlightedText text="Hello world" searchText="  Hello  world  " />
		);

		const highlighted = container.querySelectorAll('span');
		expect(highlighted).toHaveLength(2);
	});
});
