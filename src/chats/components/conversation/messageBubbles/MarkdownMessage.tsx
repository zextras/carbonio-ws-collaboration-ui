/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Tooltip } from '@zextras/carbonio-design-system';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

const MarkdownContainer = styled.div`
	user-select: text;
	word-break: break-word;
	line-height: 1.45;

	p {
		margin: 0;
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
	}

	hr {
		border: none;
		border-top: 1px solid ${({ theme }): string => theme.palette.gray3.regular};
		margin: 0.5rem 0;
	}

	table {
		border-collapse: collapse;
		margin: 0.25rem 0;
		font-size: 0.9em;
	}

	th,
	td {
		border: 1px solid ${({ theme }): string => theme.palette.gray3.regular};
		padding: 0.25rem 0.5rem;
		text-align: left;
	}

	th {
		background: ${({ theme }): string => theme.palette.gray5.regular};
		font-weight: 600;
	}
`;

const CodeBlockWrapper = styled.div`
	position: relative;
	margin: 0.375rem 0;
	border-radius: 0.375rem;
	overflow: hidden;

	&:hover button {
		opacity: 1;
	}
`;

const CodeHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #1e1e2e;
	padding: 0.25rem 0.5rem 0.25rem 0.75rem;
	font-family: 'Roboto Mono', 'Courier New', monospace;
	font-size: 0.75rem;
	color: #a6adc8;
`;

const CopyButton = styled.button`
	opacity: 0;
	transition: opacity 150ms ease;
	background: transparent;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	padding: 0.25rem;
	border-radius: 0.25rem;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	${CodeBlockWrapper}:hover & {
		opacity: 1;
	}
`;

const CopiedLabel = styled.span`
	font-family: 'Roboto Mono', 'Courier New', monospace;
	font-size: 0.75rem;
	color: #a6e3a1;
	padding-right: 0.25rem;
`;

type CodeBlockProps = {
	language: string;
	code: string;
};

const CodeBlock: FC<CodeBlockProps> = ({ language, code }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback((): void => {
		navigator.clipboard
			.writeText(code)
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
				{copied ? (
					<CopiedLabel>Copied!</CopiedLabel>
				) : (
					<Tooltip label="Copy code">
						<CopyButton onClick={handleCopy} type="button" aria-label="Copy code">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
								<rect x="9" y="9" width="13" height="13" rx="2" stroke="#a6adc8" strokeWidth="2" />
								<path
									d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
									stroke="#a6adc8"
									strokeWidth="2"
								/>
							</svg>
						</CopyButton>
					</Tooltip>
				)}
			</CodeHeader>
			<SyntaxHighlighter
				language={language || 'text'}
				style={oneDark}
				customStyle={{
					margin: 0,
					borderRadius: 0,
					fontSize: '0.8125rem',
					padding: '0.75rem 1rem'
				}}
				wrapLongLines
			>
				{code}
			</SyntaxHighlighter>
		</CodeBlockWrapper>
	);
};

type MarkdownMessageProps = {
	text: string;
};

const markdownComponents: Components = {
	code({ className, children }) {
		const match = /language-(\w+)/.exec(className || '');
		let rawCode = '';
		if (Array.isArray(children)) {
			rawCode = children.join('');
		} else if (typeof children === 'string' || typeof children === 'number') {
			rawCode = `${children}`;
		}
		const trimmedCode = rawCode.replace(/\n$/, '');

		if (match || trimmedCode.includes('\n')) {
			return <CodeBlock language={match?.[1] || ''} code={trimmedCode} />;
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

const MarkdownMessage: FC<MarkdownMessageProps> = ({ text }) => {
	const processedText = useMemo(() => wrapDetectedCode(text), [text]);

	return (
		<MarkdownContainer>
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
				{processedText}
			</ReactMarkdown>
		</MarkdownContainer>
	);
};

export default MarkdownMessage;
