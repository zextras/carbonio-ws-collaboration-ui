/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Chat-oriented markdown subset: everything not in the whitelist below stays
// literal by construction (headings, hr, tables, images, indentation, blank
// lines). Compared to CommonMark we intentionally drop: backslash escapes,
// HTML entities, reference-style links, nested blockquotes, multi-line list
// items, emphasis spanning newlines, bold-inside-italic with * markers.

export type InlineToken =
	| { type: 'text'; value: string }
	| { type: 'literal'; value: string }
	| { type: 'code'; value: string }
	| { type: 'link'; href: string; text: string }
	| { type: 'strong' | 'em' | 'del'; children: InlineToken[] };

export type Block =
	| { type: 'paragraph'; content: string }
	| { type: 'blank' }
	| { type: 'quote'; content: string }
	| { type: 'list'; ordered: boolean; start: number; items: string[] }
	| { type: 'codeBlock'; language: string; code: string };

const FENCE_OPEN = /^```([^\s`]{0,50})\s{0,10}$/;
const FENCE_CLOSE = /^```\s{0,10}$/;
const QUOTE_LINE = /^> ?/;
const UL_ITEM = /^[-*] /;
const OL_ITEM = /^(\d{1,9})\. /;

function startsBlock(line: string): boolean {
	return (
		line === '' ||
		FENCE_OPEN.test(line) ||
		QUOTE_LINE.test(line) ||
		UL_ITEM.test(line) ||
		OL_ITEM.test(line)
	);
}

type BlockScan = { block: Block; next: number };

function consumeWhile(
	lines: string[],
	start: number,
	matches: (line: string) => boolean
): { taken: string[]; next: number } {
	let index = start;
	while (index < lines.length && matches(lines[index])) {
		index += 1;
	}
	return { taken: lines.slice(start, index), next: index };
}

function scanFence(lines: string[], index: number): BlockScan | null {
	const fence = FENCE_OPEN.exec(lines[index]);
	if (!fence) return null;

	// unclosed fence: the code block runs to the end of the message
	const { taken, next } = consumeWhile(lines, index + 1, (line) => !FENCE_CLOSE.test(line));
	return {
		block: { type: 'codeBlock', language: fence[1], code: taken.join('\n') },
		next: next + 1
	};
}

function scanQuote(lines: string[], index: number): BlockScan {
	const { taken, next } = consumeWhile(lines, index, (line) => QUOTE_LINE.test(line));
	return {
		block: { type: 'quote', content: taken.map((line) => line.replace(QUOTE_LINE, '')).join('\n') },
		next
	};
}

function scanList(lines: string[], index: number): BlockScan | null {
	const orderedItem = OL_ITEM.exec(lines[index]);
	if (!orderedItem && !UL_ITEM.test(lines[index])) return null;

	const marker = orderedItem ? OL_ITEM : UL_ITEM;
	const { taken, next } = consumeWhile(lines, index, (line) => marker.test(line));
	return {
		block: {
			type: 'list',
			ordered: Boolean(orderedItem),
			start: orderedItem ? Number(orderedItem[1]) : 1,
			items: taken.map((line) => line.replace(marker, ''))
		},
		next
	};
}

function scanParagraph(lines: string[], index: number): BlockScan {
	const { taken, next } = consumeWhile(lines, index, (line) => !startsBlock(line));
	return { block: { type: 'paragraph', content: taken.join('\n') }, next };
}

function scanBlock(lines: string[], index: number): BlockScan {
	if (lines[index] === '') {
		return { block: { type: 'blank' }, next: index + 1 };
	}
	if (QUOTE_LINE.test(lines[index])) {
		return scanQuote(lines, index);
	}
	return scanFence(lines, index) ?? scanList(lines, index) ?? scanParagraph(lines, index);
}

export function parseBlocks(source: string): Block[] {
	const blocks: Block[] = [];
	const lines = source.replaceAll(/\r\n?/g, '\n').split('\n');
	let index = 0;

	while (index < lines.length) {
		const { block, next } = scanBlock(lines, index);
		blocks.push(block);
		index = next;
	}

	while (blocks.at(-1)?.type === 'blank') {
		blocks.pop();
	}
	return blocks;
}

const CODE_SPAN = /`([^`\n]{1,2000})`/;
const IMAGE = /!\[[^\]\n]{0,500}\]\([^)\n]{0,2000}\)/;
const LINK = /\[([^\]\n]{1,500})\]\((https?:\/\/[^)\s]{1,2000}|mailto:[^)\s]{1,320})\)/;
const AUTOLINK = /<(https?:\/\/[^\s>]{1,2000})>/;
const BARE_URL = /https?:\/\/[^\s<>]{1,2000}/;
const WWW_URL = /(?<![\w.])www\.[A-Za-z0-9-]{1,63}\.[^\s<>]{2,500}/;
const EMAIL = /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,24}/;
// delimiters must hug their content (no inner leading/trailing space) so
// literal uses like "2 * 3 * 4" or snake_case identifiers are left alone
const STRONG_ASTERISK = /\*\*(?!\s)([^\n]{1,1000}?)(?<!\s)\*\*/;
const STRONG_UNDERSCORE = /(?<!\w)__(?!\s)([^\n]{1,1000}?)(?<!\s)__(?!\w)/;
const EM_ASTERISK = /\*(?![\s*])([^*\n]{1,1000}?)(?<!\s)\*/;
const EM_UNDERSCORE = /(?<!\w)_(?![\s_])([^_\n]{1,1000}?)(?<!\s)_(?!\w)/;
const DEL = /~~(?!\s)([^\n]{1,1000}?)(?<!\s)~~/;

// bare URLs often end a sentence: trailing punctuation is not part of the link
function trimBareUrl(url: string): string {
	let trimmed = url.replace(/[.,;:!?'"]{1,20}$/, '');
	if (trimmed.endsWith(')') && !trimmed.includes('(')) {
		trimmed = trimmed.slice(0, -1);
	}
	return trimmed;
}

// emphasis content is re-tokenized recursively by parseInline; the rule only
// carries the raw content out
type RuleResult =
	| { token: InlineToken; length: number }
	| { emphasis: 'strong' | 'em' | 'del'; content: string; length: number };

type InlineRule = {
	pattern: RegExp;
	toResult: (match: RegExpExecArray) => RuleResult;
};

function emphasisRule(pattern: RegExp, emphasis: 'strong' | 'em' | 'del'): InlineRule {
	return {
		pattern,
		toResult: (match): RuleResult => ({ emphasis, content: match[1], length: match[0].length })
	};
}

const RULES: InlineRule[] = [
	{
		pattern: CODE_SPAN,
		toResult: (match): RuleResult => ({
			token: { type: 'code', value: match[1] },
			length: match[0].length
		})
	},
	// images degrade to their literal source; matched before the URL rules so
	// the inner URL is not linkified
	{
		pattern: IMAGE,
		toResult: (match): RuleResult => ({
			token: { type: 'literal', value: match[0] },
			length: match[0].length
		})
	},
	// the scheme allowlist in LINK/AUTOLINK/BARE_URL is the sanitizer:
	// javascript: and friends never match and stay plain text
	{
		pattern: LINK,
		toResult: (match): RuleResult => ({
			token: { type: 'link', href: match[2], text: match[1] },
			length: match[0].length
		})
	},
	{
		pattern: AUTOLINK,
		toResult: (match): RuleResult => ({
			token: { type: 'link', href: match[1], text: match[1] },
			length: match[0].length
		})
	},
	{
		pattern: BARE_URL,
		toResult: (match): RuleResult => {
			const url = trimBareUrl(match[0]);
			return { token: { type: 'link', href: url, text: url }, length: url.length };
		}
	},
	// scheme-less www URLs are common in chat: link them with an http fallback
	{
		pattern: WWW_URL,
		toResult: (match): RuleResult => {
			const url = trimBareUrl(match[0]);
			return { token: { type: 'link', href: `http://${url}`, text: url }, length: url.length };
		}
	},
	{
		pattern: EMAIL,
		toResult: (match): RuleResult => ({
			token: { type: 'link', href: `mailto:${match[0]}`, text: match[0] },
			length: match[0].length
		})
	},
	emphasisRule(STRONG_ASTERISK, 'strong'),
	emphasisRule(STRONG_UNDERSCORE, 'strong'),
	emphasisRule(EM_ASTERISK, 'em'),
	emphasisRule(EM_UNDERSCORE, 'em'),
	emphasisRule(DEL, 'del')
];

type BestMatch = { index: number; match: RegExpExecArray; rule: InlineRule };

function findEarliestMatch(rest: string): BestMatch | null {
	let best: BestMatch | null = null;
	RULES.forEach((rule) => {
		const match = rule.pattern.exec(rest);
		if (match && (best === null || match.index < best.index)) {
			best = { index: match.index, match, rule };
		}
	});
	return best;
}

// earliest match wins, rule order breaks ties; unmatched syntax (unclosed
// delimiters, unsupported markers) falls through as plain text
export function parseInline(text: string): InlineToken[] {
	const tokens: InlineToken[] = [];
	let rest = text;

	while (rest.length > 0) {
		const best = findEarliestMatch(rest);
		if (best === null) {
			tokens.push({ type: 'text', value: rest });
			break;
		}

		if (best.index > 0) {
			tokens.push({ type: 'text', value: rest.slice(0, best.index) });
		}
		const result = best.rule.toResult(best.match);
		tokens.push(
			'token' in result
				? result.token
				: { type: result.emphasis, children: parseInline(result.content) }
		);
		rest = rest.slice(best.index + result.length);
	}

	return tokens;
}
