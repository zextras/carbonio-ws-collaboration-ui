/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const ISO_WITH_FRACTION = /^(.*T\d{2}:\d{2}:\d{2})\.(\d+)(.*)$/;

// Same epoch-ms-with-fraction encoding the SDK gives message dates: microseconds survive
export function parseIsoMicros(iso: string | undefined): number {
	if (!iso) {
		return 0;
	}
	const match = ISO_WITH_FRACTION.exec(iso);
	if (!match) {
		const parsed = Date.parse(iso);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	const [, head, fraction = '', tail] = match;
	const digits = fraction.slice(0, 6).padEnd(6, '0');
	const parsed = Date.parse(`${head}.${digits.slice(0, 3)}${tail}`);
	return Number.isNaN(parsed) ? 0 : parsed + Number(digits.slice(3)) / 1000;
}

export function toIsoMicros(ms: number): string {
	let wholeMs = Math.floor(ms);
	let micros = Math.round((ms - wholeMs) * 1000);
	if (micros >= 1000) {
		wholeMs += 1;
		micros -= 1000;
	}
	return `${new Date(wholeMs).toISOString().slice(0, -1)}${String(micros).padStart(3, '0')}Z`;
}
