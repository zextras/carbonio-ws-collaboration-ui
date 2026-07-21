/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
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

	test('does not turn pasted code into a code block without an explicit fence', () => {
		const pastedCode =
			'import React from "react";\n\nconst App = () => {\n  return <div>Hello</div>;\n};\n\nexport default App;';
		setup(<MarkdownMessage text={pastedCode} />);
		expect(screen.queryByText('code')).toBeNull();
		expect(screen.queryByLabelText('Copy code')).toBeNull();
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

	test('preserves leading spaces on continuation lines', () => {
		setup(<MarkdownMessage text={'lista:\n   punto uno\n   punto due'} />);
		const paragraph = screen.getByText(/lista:/);
		expect(paragraph).toHaveTextContent(/lista:\n {3}punto uno\n {3}punto due/, {
			normalizeWhitespace: false
		});
	});

	test('preserves leading spaces on the first line', () => {
		setup(<MarkdownMessage text={'  ciao'} />);
		expect(screen.getByText(/ciao/)).toHaveTextContent(/ {2}ciao/, {
			normalizeWhitespace: false
		});
	});

	test('does not turn text indented with 4+ spaces into a code block', () => {
		setup(<MarkdownMessage text={'    comando indentato'} />);
		expect(screen.queryByLabelText('Copy code')).toBeNull();
		expect(screen.getByText(/comando indentato/)).toHaveTextContent(/ {4}comando indentato/, {
			normalizeWhitespace: false
		});
	});

	test('keeps typed blank lines between paragraphs visible', () => {
		setup(<MarkdownMessage text={'dfegergreg\nwefwefew\n\n\nwef'} />);
		expect(document.querySelectorAll('br')).toHaveLength(2);
	});

	test('renders one blank line for a single empty line between paragraphs', () => {
		setup(<MarkdownMessage text={'first\n\nsecond'} />);
		expect(document.querySelectorAll('br')).toHaveLength(1);
	});

	test('does not render setext h1 and keeps the underline visible', () => {
		setup(<MarkdownMessage text={'Total Cost\n=========='} />);
		expect(screen.queryByRole('heading')).toBeNull();
		expect(screen.getByText(/Total Cost/)).toBeVisible();
		expect(screen.getByText(/==========/)).toBeVisible();
	});

	test('does not render setext h2 and keeps the underline visible', () => {
		setup(<MarkdownMessage text={'Total Cost\n--'} />);
		expect(screen.queryByRole('heading')).toBeNull();
		expect(screen.getByText(/Total Cost/)).toBeVisible();
		expect(screen.getByText(/--/)).toBeVisible();
	});

	test('does not escape markdown markers inside a fenced code block', () => {
		setup(<MarkdownMessage text={'```python\n# commento importante\nvalore = 1\n```'} />);
		expect(screen.getByText(/# commento importante/)).toBeVisible();
		expect(screen.queryByText(/\\# commento importante/)).toBeNull();
	});

	test('degrades image to its literal markdown keeping surrounding text', () => {
		setup(<MarkdownMessage text={'guarda qui ![screenshot](https://example.com/y.png) ok?'} />);
		expect(screen.queryByRole('img')).toBeNull();
		expect(screen.getByText(/guarda qui/)).toBeVisible();
		expect(screen.getByText('![screenshot](https://example.com/y.png)')).toBeVisible();
	});

	test('degrades a lone image to its literal markdown without an empty bubble', () => {
		setup(<MarkdownMessage text={'![screenshot](https://example.com/x.png)'} />);
		expect(screen.queryByRole('img')).toBeNull();
		expect(screen.getByText('![screenshot](https://example.com/x.png)')).toBeVisible();
	});

	test('does not render tables and keeps the literal text', () => {
		setup(<MarkdownMessage text={'| A | B |\n|---|---|\n| 1 | 2 |'} />);
		expect(screen.queryByRole('table')).toBeNull();
		expect(screen.getByText(/\| A \| B \|/)).toBeVisible();
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

	test('renders scheme-less www url as link with http fallback', () => {
		setup(<MarkdownMessage text="guarda su www.example.com per i dettagli" />);
		const link = screen.getByText('www.example.com');
		expect(link.tagName).toBe('A');
		expect(link).toHaveAttribute('href', 'http://www.example.com');
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
