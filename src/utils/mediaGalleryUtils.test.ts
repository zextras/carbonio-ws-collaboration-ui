/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { groupAttachmentsByMonth } from './mediaGalleryUtils';
import { Attachment } from '../types/network/models/attachmentTypes';

const buildAttachment = (id: string, createdAt: string): Attachment => ({
	id,
	name: `${id}.txt`,
	size: 1024,
	mimeType: 'text/plain',
	userId: 'u',
	roomId: 'r',
	createdAt
});

describe('groupAttachmentsByMonth', () => {
	test('returns an empty array on empty input', () => {
		expect(groupAttachmentsByMonth([])).toEqual([]);
	});

	test('puts attachments of the same month into a single group', () => {
		const att1 = buildAttachment('a1', '2021-08-15T10:00:00Z');
		const att2 = buildAttachment('a2', '2021-08-02T10:00:00Z');
		const result = groupAttachmentsByMonth([att1, att2]);
		expect(result).toHaveLength(1);
		expect(result[0].key).toBe('2021-08');
		expect(result[0].label).toBe('August 2021');
		expect(result[0].items).toEqual([att1, att2]);
	});

	test('keeps the input ordering across months and within a month', () => {
		const aug2 = buildAttachment('aug2', '2021-08-15T10:00:00Z');
		const aug1 = buildAttachment('aug1', '2021-08-02T10:00:00Z');
		const may = buildAttachment('may', '2021-05-10T10:00:00Z');
		const result = groupAttachmentsByMonth([aug2, aug1, may]);
		expect(result.map((g) => g.key)).toEqual(['2021-08', '2021-05']);
		expect(result[0].items.map((a) => a.id)).toEqual(['aug2', 'aug1']);
		expect(result[1].items.map((a) => a.id)).toEqual(['may']);
	});

	test('handles attachments spanning different years', () => {
		const dec = buildAttachment('dec', '2020-12-31T10:00:00Z');
		const jan = buildAttachment('jan', '2021-01-01T10:00:00Z');
		const result = groupAttachmentsByMonth([jan, dec]);
		expect(result.map((g) => g.key)).toEqual(['2021-01', '2020-12']);
		expect(result.map((g) => g.label)).toEqual(['January 2021', 'December 2020']);
	});
});
