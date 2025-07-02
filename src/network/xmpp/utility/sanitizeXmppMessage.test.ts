/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sanitizeXmppMessage } from './sanitizeXmppMessage';

const invalidControlCharacters: { char: string; name: string; code: string }[] = [
	{ char: '\u0000', name: 'Null (NUL)', code: 'U+0000' },
	{ char: '\u0001', name: 'Start of Heading (SOH)', code: 'U+0001' },
	{ char: '\u0002', name: 'Start of Text (STX)', code: 'U+0002' },
	{ char: '\u0003', name: 'End of Text (ETX)', code: 'U+0003' },
	{ char: '\u0004', name: 'End of Transmission (EOT)', code: 'U+0004' },
	{ char: '\u0005', name: 'Enquiry (ENQ)', code: 'U+0005' },
	{ char: '\u0006', name: 'Acknowledge (ACK)', code: 'U+0006' },
	{ char: '\u0007', name: 'Bell (BEL)', code: 'U+0007' },
	{ char: '\u0008', name: 'Backspace (BS)', code: 'U+0008' },
	{ char: '\u000B', name: 'Vertical Tab (VT)', code: 'U+000B' },
	{ char: '\u000C', name: 'Form Feed (FF)', code: 'U+000C' },
	{ char: '\u000E', name: 'Shift Out (SO)', code: 'U+000E' },
	{ char: '\u000F', name: 'Shift In (SI)', code: 'U+000F' },
	{ char: '\u0010', name: 'Data Link Escape (DLE)', code: 'U+0010' },
	{ char: '\u0011', name: 'Device Control 1 (DC1)', code: 'U+0011' },
	{ char: '\u0012', name: 'Device Control 2 (DC2)', code: 'U+0012' },
	{ char: '\u0013', name: 'Device Control 3 (DC3)', code: 'U+0013' },
	{ char: '\u0014', name: 'Device Control 4 (DC4)', code: 'U+0014' },
	{ char: '\u0015', name: 'Negative Acknowledge (NAK)', code: 'U+0015' },
	{ char: '\u0016', name: 'Synchronous Idle (SYN)', code: 'U+0016' },
	{ char: '\u0017', name: 'End of Transmission Block (ETB)', code: 'U+0017' },
	{ char: '\u0018', name: 'Cancel (CAN)', code: 'U+0018' },
	{ char: '\u0019', name: 'End of Medium (EM)', code: 'U+0019' },
	{ char: '\u001A', name: 'Substitute (SUB)', code: 'U+001A' },
	{ char: '\u001B', name: 'Escape (ESC)', code: 'U+001B' },
	{ char: '\u001C', name: 'File Separator (FS)', code: 'U+001C' },
	{ char: '\u001D', name: 'Group Separator (GS)', code: 'U+001D' },
	{ char: '\u001E', name: 'Record Separator (RS)', code: 'U+001E' },
	{ char: '\u001F', name: 'Unit Separator (US)', code: 'U+001F' },
	{ char: '\u007F', name: 'Delete (DEL)', code: 'U+007F' }
];

describe('sanitizeXmppMessage', () => {
	test.each(invalidControlCharacters)('Function should remove %s from the message', (item) => {
		const { char } = item;
		const input = `Hello${char}World`;
		const output = sanitizeXmppMessage(input);
		expect(output).toBe('HelloWorld');
	});

	test('Function should preserve valid control characters (TAB, LF, CR)', () => {
		const input = 'Foo\tBar\nBaz\rQux';
		expect(sanitizeXmppMessage(input)).toBe(input);
	});
});
