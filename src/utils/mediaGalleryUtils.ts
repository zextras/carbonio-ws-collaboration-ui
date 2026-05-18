/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import moment from 'moment-timezone';

import { Attachment } from '../types/network/models/attachmentTypes';

type AttachmentMonthGroup = {
	key: string;
	label: string;
	items: Array<Attachment>;
};

/**
 * Groups a list of attachments by calendar month/year, preserving the input order
 * both across groups and within each group. The input is expected to be already
 * sorted (newest first by default), so the grouping is purely derivational.
 */
export const groupAttachmentsByMonth = (
	attachments: Array<Attachment>
): Array<AttachmentMonthGroup> => {
	const byKey = new Map<string, AttachmentMonthGroup>();
	const ordered: Array<AttachmentMonthGroup> = [];

	attachments.forEach((attachment) => {
		const date = moment(attachment.createdAt);
		const key = date.format('YYYY-MM');
		let group = byKey.get(key);
		if (!group) {
			group = { key, label: date.format('MMMM YYYY'), items: [] };
			byKey.set(key, group);
			ordered.push(group);
		}
		group.items.push(attachment);
	});

	return ordered;
};
