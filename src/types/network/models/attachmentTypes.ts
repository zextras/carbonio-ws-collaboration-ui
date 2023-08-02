/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type Attachment = {
	id: string;
	name: string;
	size: number;
	mimeType: string;
	userId: string;
	roomId: string;
	createdAt: string;
};

export type AttachmentsPagination = {
	filter: string;
	attachments: Attachment[];
};

export type AdditionalHeaders = {
	description?: string;
	messageId?: string;
	replyId?: string;
	area?: string;
};
