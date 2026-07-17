/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Icon, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CODE_HEURISTIC_PATTERNS = [
	/^(import|export|from)\s{1,100}/m,
	/^(const|let|var|function|class|interface|type|enum)\s{1,100}/m,
	/^(def|class|import|from|if __name__)\s{1,100}/m,
	/^(public|private|protected|static|void|int|String)\s{1,100}/m,
	/[{}[\]];?\s{0,100}$/m,
	/^\s{0,100}(if|else|for|while|return|switch|case)\s{0,100}[({]/m,
	/=>\s{0,100}[{(]/m,
	/\.\w{1,100}\([^)]{0,500}\)/m,
	/<\/?[A-Z]\w{1,100}[\s/>]/m
];

const MULTI_LINE_THRESHOLD = 3;
const PATTERN_MATCH_THRESHOLD = 2;

function looksLikeCode(text: string): boolean {
	const lines = text.split('\n');
	if (lines.length < MULTI_LINE_THRESHOLD) return false;

	const matchCount = CODE_HEURISTIC_PATTERNS.filter((pattern) => pattern.test(text)).length;
	return matchCount >= PATTERN_MATCH_THRESHOLD;
}

function hasMarkdownSyntax(text: string): boolean {
	if (text.includes('`') || text.includes('*') || text.includes('_')) return true;
	return /^#{1,6}\s|^[-*+]\s|^\d{1,10}\.\s|^>\s|\[[^\]]{1,200}\]\([^)]{1,2000}\)/m.test(text);
}

function wrapDetectedCode(text: string): string {
	if (hasMarkdownSyntax(text)) return text;
	if (looksLikeCode(text)) return `\`\`\`\n${text}\n\`\`\``;
	return text;
}

type NodeWithPosition = {
	position?: { start?: { offset?: number }; end?: { offset?: number } };
};

// slice of the source text the node was parsed from, as the user typed it
function rawText(node: NodeWithPosition | undefined, source: string): string | undefined {
	const start = node?.position?.start?.offset;
	const end = node?.position?.end?.offset;
	return start !== undefined && end !== undefined ? source.slice(start, end) : undefined;
}

const MarkdownContainer = styled.div`
	user-select: text;
	word-break: break-word;
	line-height: 1.45;

	p {
		margin: 0;
		white-space: pre-wrap;
		& + p {
			margin-top: 0.25rem;
		}
	}

	strong {
		font-weight: 700;
	}

	em {
		font-style: italic;
	}

	del {
		text-decoration: line-through;
	}

	a {
		color: ${({ theme }): string => theme.palette.info.regular};
		text-decoration: underline;
		&:hover {
			color: ${({ theme }): string => theme.palette.info.hover};
		}
		&:focus {
			color: ${({ theme }): string => theme.palette.info.focus};
		}
		&:active {
			color: ${({ theme }): string => theme.palette.info.active};
		}
	}

	code:not(pre code) {
		background: ${({ theme }): string => theme.palette.gray4.regular};
		border-radius: 0.1875rem;
		padding: 0.125rem 0.3125rem;
		font-family: 'Roboto Mono', 'Courier New', monospace;
		font-size: 0.85em;
	}

	blockquote {
		border-left: 0.1875rem solid ${({ theme }): string => theme.palette.gray3.regular};
		margin: 0.25rem 0;
		padding: 0.125rem 0 0.125rem 0.5rem;
		color: ${({ theme }): string => theme.palette.text.regular};
		opacity: 0.8;
	}

	ul,
	ol {
		margin: 0.25rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin: 0.125rem 0;
		white-space: pre-wrap;
	}
`;

const CodeBlockWrapper = styled.div`
	position: relative;
	margin: 0.375rem 0;
	border-radius: 0.375rem;
	overflow: hidden;
	background: ${({ theme }): string => theme.palette.gray0.regular};
`;

const CodeHeader = styled.div`
	display: flex;
	align-items: center;
	border-bottom: 1px solid ${({ theme }): string => theme.palette.gray1.regular};
	padding: 0.25rem 0.75rem;
	font-family: 'Roboto Mono', 'Courier New', monospace;
	font-size: 0.75rem;
	color: ${({ theme }): string => theme.palette.gray4.regular};
`;

const CopyControl = styled.div`
	position: absolute;
	bottom: 0.375rem;
	right: 0.5rem;
	display: flex;
	align-items: center;
`;

const CopyButton = styled.button`
	opacity: 0;
	transition: opacity 150ms ease;
	background: ${({ theme }): string => theme.palette.gray0.regular};
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	padding: 0.25rem;
	border-radius: 0.25rem;

	&:hover {
		background: ${({ theme }): string => theme.palette.gray1.regular};
	}

	${CodeBlockWrapper}:hover &,
	&:focus-visible {
		opacity: 1;
	}
`;

const CopiedLabel = styled.span`
	font-family: 'Roboto Mono', 'Courier New', monospace;
	font-size: 0.75rem;
	color: ${({ theme }): string => theme.palette.success.regular};
	background: ${({ theme }): string => theme.palette.gray0.regular};
	padding: 0.25rem 0.375rem;
	border-radius: 0.25rem;
`;

const StyledPre = styled.pre`
	margin: 0;
	padding: 0.75rem 1rem;
	font-family: 'Roboto Mono', 'Courier New', monospace;
	font-size: 0.8125rem;
	line-height: 1.5;
	color: ${({ theme }): string => theme.palette.gray6.regular};
	white-space: pre-wrap;
	word-break: break-word;
`;

type CodeBlockProps = {
	language: string;
	code: string;
};

const CodeBlock: FC<CodeBlockProps> = ({ language, code }) => {
	const [t] = useTranslation();
	const copyCodeLabel = t('action.copyCode', 'Copy code');
	const codeCopiedLabel = t('feedback.codeCopied', 'Copied!');

	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback((): void => {
		navigator.clipboard
			?.writeText(code)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => undefined);
	}, [code]);

	return (
		<CodeBlockWrapper>
			<CodeHeader>
				<span>{language || 'code'}</span>
			</CodeHeader>
			<StyledPre>
				<code>{code}</code>
			</StyledPre>
			<CopyControl>
				{copied ? (
					<CopiedLabel>{codeCopiedLabel}</CopiedLabel>
				) : (
					<Tooltip label={copyCodeLabel}>
						<CopyButton onClick={handleCopy} type="button" aria-label={copyCodeLabel}>
							<Icon icon="Copy" size="small" color="gray4" />
						</CopyButton>
					</Tooltip>
				)}
			</CopyControl>
		</CodeBlockWrapper>
	);
};

// Markdown supported: bold, italic, strikethrough, inline/block
// code, links and autolinks, blockquote, ordered/unordered lists
const SUPPORTED_ELEMENTS = [
	'p',
	'br',
	'strong',
	'em',
	'del',
	'code',
	'pre',
	'a',
	'blockquote',
	'ul',
	'ol',
	'li'
];

// Everything else is rendered back as the literal source text the user typed
const UNSUPPORTED_BLOCK_ELEMENTS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'table'];
const UNSUPPORTED_INLINE_ELEMENTS = ['img', 'input'];

const ALLOWED_ELEMENTS = [
	...SUPPORTED_ELEMENTS,
	...UNSUPPORTED_BLOCK_ELEMENTS,
	...UNSUPPORTED_INLINE_ELEMENTS
];

// blank lines the user typed before a block would be collapsed by the parser:
// count the newlines in the source right before the block so they can be
// rendered back as visible empty lines
function countBlankLinesBefore(node: NodeWithPosition | undefined, source: string): number {
	const start = node?.position?.start?.offset;
	if (start === undefined) return 0;

	let newlines = 0;
	let index = start - 1;
	while (
		index >= 0 &&
		(source[index] === '\n' || source[index] === ' ' || source[index] === '\t')
	) {
		if (source[index] === '\n') newlines += 1;
		index -= 1;
	}
	// after a previous block one newline is the block separator itself, while at
	// the start of the message every newline is a blank line
	return index < 0 ? newlines : Math.max(0, newlines - 1);
}

type HastNode = NodeWithPosition & { type?: string; value?: string; children?: HastNode[] };

// the parser strips the spaces the user typed around line breaks inside a
// paragraph: put them back from the source slice, but only when source and
// parsed value differ in whitespace alone (escapes and entities must keep
// their parsed form)
function restoreStrippedSpaces(node: HastNode, source: string): void {
	if (node.type === 'text' && typeof node.value === 'string') {
		const slice = rawText(node, source);
		if (
			slice !== undefined &&
			slice !== node.value &&
			slice.replaceAll(/\s+/g, '') === node.value.replaceAll(/\s+/g, '')
		) {
			Object.assign(node, { value: slice });
		}
	}
	node.children?.forEach((child) => restoreStrippedSpaces(child, source));
}

function rehypeRestoreStrippedSpaces() {
	return (tree: HastNode, file: { value?: unknown }): void => {
		if (typeof file.value === 'string') restoreStrippedSpaces(tree, file.value);
	};
}

type LiteralProps = { node?: NodeWithPosition; children?: React.ReactNode };

function buildMarkdownComponents(source: string): Components {
	const blanksBefore = (node: NodeWithPosition | undefined): React.JSX.Element[] =>
		Array.from({ length: countBlankLinesBefore(node, source) }, (_, index) => <br key={index} />);

	// spaces between the start of the line and the block, stripped by the parser
	const indentBefore = (node: NodeWithPosition | undefined): string => {
		const start = node?.position?.start?.offset;
		if (start === undefined) return '';

		let index = start - 1;
		while (index >= 0 && (source[index] === ' ' || source[index] === '\t')) {
			index -= 1;
		}
		return index < 0 || source[index] === '\n' ? source.slice(index + 1, start) : '';
	};

	const blockWithBlanks = (
		Tag: 'p' | 'blockquote' | 'ul' | 'ol',
		node: NodeWithPosition | undefined,
		children: React.ReactNode
	): React.JSX.Element => (
		<>
			{blanksBefore(node)}
			<Tag>
				{Tag === 'p' && indentBefore(node)}
				{children}
			</Tag>
		</>
	);

	const literal = (Tag: 'p' | 'span'): FC<LiteralProps> =>
		function Literal({ node, children }: LiteralProps) {
			return (
				<>
					{Tag === 'p' && blanksBefore(node)}
					<Tag>
						{Tag === 'p' && indentBefore(node)}
						{rawText(node, source) ?? children}
					</Tag>
				</>
			);
		};

	const supported: Components = {
		p({ node, children }) {
			return blockWithBlanks('p', node, children as React.ReactNode);
		},
		blockquote({ node, children }) {
			return blockWithBlanks('blockquote', node, children as React.ReactNode);
		},
		ul({ node, children }) {
			return blockWithBlanks('ul', node, children as React.ReactNode);
		},
		ol({ node, children }) {
			return blockWithBlanks('ol', node, children as React.ReactNode);
		},
		// fenced blocks unwrap so CodeBlock provides its own pre; indented code
		// blocks (4+ leading spaces) degrade to the literal indented text, since
		// in a chat leading spaces are indentation, not code syntax
		pre({ node, children }) {
			const start = node?.position?.start?.offset;
			const end = node?.position?.end?.offset;
			const isFence = start !== undefined && (source[start] === '`' || source[start] === '~');

			if (start !== undefined && end !== undefined && !isFence) {
				return (
					<>
						{blanksBefore(node)}
						<p>
							{indentBefore(node)}
							{source.slice(start, end)}
						</p>
					</>
				);
			}
			// eslint-disable-next-line react/jsx-no-useless-fragment
			return <>{children}</>;
		},
		code({ node, className, children }) {
			const language = /language-(\w+)/.exec(className ?? '')?.[1];
			const code = React.Children.toArray(children as React.ReactNode)
				.filter((child) => typeof child === 'string' || typeof child === 'number')
				.join('')
				.replace(/\n$/, '');

			if (language || code.includes('\n')) {
				return (
					<>
						{blanksBefore(node)}
						<CodeBlock language={language ?? ''} code={code} />
					</>
				);
			}
			return <code className={className}>{children}</code>;
		},
		a({ href, children }) {
			return (
				<a href={href} target="_blank" rel="noopener noreferrer">
					{children}
				</a>
			);
		}
	};

	return {
		...(Object.fromEntries([
			...UNSUPPORTED_BLOCK_ELEMENTS.map((tag) => [tag, literal('p')]),
			...UNSUPPORTED_INLINE_ELEMENTS.map((tag) => [tag, literal('span')])
		]) as Components),
		...supported
	};
}

const MarkdownMessage: FC<{ text: string }> = ({ text }) => {
	const processedText = useMemo(() => wrapDetectedCode(text), [text]);
	const components = useMemo(() => buildMarkdownComponents(processedText), [processedText]);

	return (
		<MarkdownContainer>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRestoreStrippedSpaces]}
				components={components}
				allowedElements={ALLOWED_ELEMENTS}
				unwrapDisallowed
			>
				{processedText}
			</ReactMarkdown>
		</MarkdownContainer>
	);
};

export default MarkdownMessage;
