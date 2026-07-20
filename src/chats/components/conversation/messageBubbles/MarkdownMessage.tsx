/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Icon, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { Block, InlineToken, parseBlocks, parseInline } from './markdownLite';

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
		white-space: pre-wrap;
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
	const resetTimer = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => (): void => clearTimeout(resetTimer.current), []);

	const handleCopy = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>): void => {
			e.stopPropagation();
			navigator.clipboard
				?.writeText(code)
				.then(() => {
					setCopied(true);
					clearTimeout(resetTimer.current);
					resetTimer.current = setTimeout(() => setCopied(false), 2000);
				})
				.catch(() => undefined);
		},
		[code]
	);

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

function renderInline(tokens: InlineToken[]): React.ReactNode {
	return [...tokens.entries()].map(([index, token]) => {
		const key = `${token.type}-${index}`;
		switch (token.type) {
			case 'text':
				return token.value;
			case 'literal':
				return <span key={key}>{token.value}</span>;
			case 'code':
				return <code key={key}>{token.value}</code>;
			case 'link':
				return (
					<a
						key={key}
						href={token.href}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e): void => e.stopPropagation()}
					>
						{token.text}
					</a>
				);
			case 'strong':
				return <strong key={key}>{renderInline(token.children)}</strong>;
			case 'em':
				return <em key={key}>{renderInline(token.children)}</em>;
			case 'del':
				return <del key={key}>{renderInline(token.children)}</del>;
			default:
				return null;
		}
	});
}

const MarkdownMessage: FC<{ text: string }> = ({ text }) => {
	const blocks = useMemo(() => parseBlocks(text), [text]);

	const renderBlock = useCallback((block: Block, index: number): React.ReactNode => {
		const key = `${block.type}-${index}`;
		switch (block.type) {
			case 'paragraph':
				return <p key={key}>{renderInline(parseInline(block.content))}</p>;
			case 'blank':
				return <br key={key} />;
			case 'quote':
				return <blockquote key={key}>{renderInline(parseInline(block.content))}</blockquote>;
			case 'list': {
				const items = [...block.items.entries()].map(([itemIndex, item]) => (
					<li key={`item-${itemIndex}`}>{renderInline(parseInline(item))}</li>
				));
				return block.ordered ? (
					<ol key={key} start={block.start}>
						{items}
					</ol>
				) : (
					<ul key={key}>{items}</ul>
				);
			}
			case 'codeBlock':
				return <CodeBlock key={key} language={block.language} code={block.code} />;
			default:
				return null;
		}
	}, []);

	return (
		<MarkdownContainer>{blocks.map((block, index) => renderBlock(block, index))}</MarkdownContainer>
	);
};

export default MarkdownMessage;
