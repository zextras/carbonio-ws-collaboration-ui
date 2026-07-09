/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MarkdownMessage from './MarkdownMessage';
import { setup } from '../../../../tests/test-utils';

const EXAMPLE_URL = 'https://example.com';

describe('MarkdownMessage', () => {
	test('renders plain text', () => {
		setup(<MarkdownMessage text="Hello world" />);
		expect(screen.getByText('Hello world')).toBeVisible();
	});

	test('renders bold text', () => {
		setup(<MarkdownMessage text="this is **bold**" />);
		const bold = screen.getByText('bold');
		expect(bold.tagName).toBe('STRONG');
	});

	test('renders italic text', () => {
		setup(<MarkdownMessage text="this is *italic*" />);
		const italic = screen.getByText('italic');
		expect(italic.tagName).toBe('EM');
	});

	test('renders strikethrough text', () => {
		setup(<MarkdownMessage text="this is ~~deleted~~" />);
		const del = screen.getByText('deleted');
		expect(del.tagName).toBe('DEL');
	});

	test('renders inline code', () => {
		setup(<MarkdownMessage text="use `useState` hook" />);
		const code = screen.getByText('useState');
		expect(code.tagName).toBe('CODE');
	});

	test('renders links with target blank', () => {
		setup(<MarkdownMessage text={`[click here](${EXAMPLE_URL})`} />);
		const link = screen.getByText('click here');
		expect(link.tagName).toBe('A');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		expect(link).toHaveAttribute('href', EXAMPLE_URL);
	});

	test('renders unordered list', () => {
		setup(<MarkdownMessage text={'- item one\n- item two'} />);
		expect(screen.getByText('item one')).toBeVisible();
		expect(screen.getByText('item two')).toBeVisible();
	});

	test('renders blockquote', () => {
		setup(<MarkdownMessage text="> a quote" />);
		const quote = screen.getByText('a quote');
		expect(quote.closest('blockquote')).not.toBeNull();
	});

	test('renders fenced code block with language label', () => {
		setup(<MarkdownMessage text={'```js\nconst x = 1;\n```'} />);
		expect(screen.getByText('js')).toBeVisible();
		expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
	});

	test('renders code block without language shows code label', () => {
		setup(<MarkdownMessage text={'```\nsome code\nhere\n```'} />);
		expect(screen.getByText('code')).toBeVisible();
		expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
	});

	test('auto-detects pasted code and wraps in code block', () => {
		const pastedCode =
			'import React from "react";\n\nconst App = () => {\n  return <div>Hello</div>;\n};\n\nexport default App;';
		setup(<MarkdownMessage text={pastedCode} />);
		expect(screen.getByText('code')).toBeVisible();
	});

	test('does not auto-detect short text as code', () => {
		setup(<MarkdownMessage text="just a normal message" />);
		expect(screen.queryByText('code')).toBeNull();
	});

	test('does not auto-detect text with markdown syntax as code', () => {
		setup(<MarkdownMessage text={'**bold** text\n- list item\n- another item'} />);
		const bold = screen.getByText('bold');
		expect(bold.tagName).toBe('STRONG');
	});

	test('preserves single line breaks in plain text', () => {
		setup(<MarkdownMessage text={'first line\nsecond line'} />);
		const paragraph = screen.getByText(/first line/);
		expect(paragraph).toHaveTextContent(/first line\nsecond line/, { normalizeWhitespace: false });
	});

	test('does not render headings and keeps the literal marker', () => {
		setup(<MarkdownMessage text="# hello title" />);
		expect(screen.queryByRole('heading')).toBeNull();
		expect(screen.getByText('# hello title')).toBeVisible();
	});

	test('keeps thematic break markers as literal text', () => {
		setup(<MarkdownMessage text={'above\n\n---\n\nbelow'} />);
		expect(screen.queryByRole('separator')).toBeNull();
		expect(screen.getByText('---')).toBeVisible();
	});

	test('does not render tables (not in whitelist)', () => {
		setup(<MarkdownMessage text={'| A | B |\n|---|---|\n| 1 | 2 |'} />);
		expect(screen.queryByRole('table')).toBeNull();
	});

	test('renders bold with underscores', () => {
		setup(<MarkdownMessage text="this is __bold__" />);
		expect(screen.getByText('bold').tagName).toBe('STRONG');
	});

	test('renders italic with underscores', () => {
		setup(<MarkdownMessage text="this is _italic_" />);
		expect(screen.getByText('italic').tagName).toBe('EM');
	});

	test('renders explicit autolink', () => {
		setup(<MarkdownMessage text={`visit <${EXAMPLE_URL}>`} />);
		const link = screen.getByText(EXAMPLE_URL);
		expect(link.tagName).toBe('A');
		expect(link).toHaveAttribute('href', EXAMPLE_URL);
	});

	test('renders bare url autolink', () => {
		setup(<MarkdownMessage text={`visit ${EXAMPLE_URL} now`} />);
		const link = screen.getByText(EXAMPLE_URL);
		expect(link.tagName).toBe('A');
	});

	test('renders email autolink as mailto', () => {
		setup(<MarkdownMessage text="write to user@example.com please" />);
		const link = screen.getByText('user@example.com');
		expect(link.tagName).toBe('A');
		expect(link).toHaveAttribute('href', 'mailto:user@example.com');
	});

	test('code block has copy button', () => {
		setup(<MarkdownMessage text={'```\nhello\nworld\n```'} />);
		expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
	});
});
