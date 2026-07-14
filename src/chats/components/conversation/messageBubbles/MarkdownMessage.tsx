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

// headings (atx and setext) and thematic breaks are not supported, but rather
// than letting the parser consume their markers and drop them, we escape the
// markers so they stay visible as the literal characters the user typed. the
// setext rule escapes the underline only when it follows a text line
function escapeUnsupportedSyntax(text: string): string {
	return text
		.replaceAll(/^(\s{0,100})(#{1,6})(\s)/gm, String.raw`$1\$2$3`)
		.replaceAll(/^(\s{0,100})([-*_])((?:[ \t]{0,100}\2){2,}[ \t]{0,100})$/gm, String.raw`$1\$2$3`)
		.replaceAll(
			/^([^\n]{0,1000}\S[^\n]{0,1000}\n\s{0,3})([=-])((?:\2){0,100}[ \t]{0,100})$/gm,
			String.raw`$1\$2$3`
		);
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

type MarkdownMessageProps = {
	text: string;
};

const markdownComponents: Components = {
	// avoid nesting CodeBlock's own pre inside the default pre wrapper
	pre({ children }) {
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <>{children}</>;
	},
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

// whitelist of supported markdown per CO-3406: bold, italic, strikethrough,
// inline/block code, links and autolinks, blockquote, ordered/unordered lists.
// everything else (headings, tables, images, task lists, hr) degrades to its
// text content instead of being rendered
const ALLOWED_ELEMENTS = [
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

const MarkdownMessage: FC<MarkdownMessageProps> = ({ text }) => {
	const processedText = useMemo(() => {
		const wrapped = wrapDetectedCode(text);
		// when wrapped as a code block, escaping would leak backslashes into the
		// verbatim code, so only escape the plain-markdown path
		return wrapped === text ? escapeUnsupportedSyntax(text) : wrapped;
	}, [text]);

	return (
		<MarkdownContainer>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={markdownComponents}
				allowedElements={ALLOWED_ELEMENTS}
				unwrapDisallowed
			>
				{processedText}
			</ReactMarkdown>
		</MarkdownContainer>
	);
};

export default MarkdownMessage;
