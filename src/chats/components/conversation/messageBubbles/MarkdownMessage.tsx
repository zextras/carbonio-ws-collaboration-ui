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

	${CodeBlockWrapper}:hover & {
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

const supportedComponents: Components = {
	// avoid nesting CodeBlock's own pre inside the default pre wrapper
	pre({ children }) {
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <>{children}</>;
	},
	code({ className, children }) {
		const language = /language-(\w+)/.exec(className ?? '')?.[1];
		const code = (Array.isArray(children) ? children.join('') : `${children ?? ''}`).replace(
			/\n$/,
			''
		);

		if (language || code.includes('\n')) {
			return <CodeBlock language={language ?? ''} code={code} />;
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

type LiteralProps = { node?: NodeWithPosition; children?: React.ReactNode };

function buildLiteralComponents(source: string): Components {
	const literal = (Tag: 'p' | 'span'): FC<LiteralProps> =>
		function Literal({ node, children }: LiteralProps) {
			return <Tag>{rawText(node, source) ?? children}</Tag>;
		};

	return Object.fromEntries([
		...UNSUPPORTED_BLOCK_ELEMENTS.map((tag) => [tag, literal('p')]),
		...UNSUPPORTED_INLINE_ELEMENTS.map((tag) => [tag, literal('span')])
	]) as Components;
}

const MarkdownMessage: FC<{ text: string }> = ({ text }) => {
	const processedText = useMemo(() => wrapDetectedCode(text), [text]);
	const components = useMemo(
		() => ({ ...supportedComponents, ...buildLiteralComponents(processedText) }),
		[processedText]
	);

	return (
		<MarkdownContainer>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
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
