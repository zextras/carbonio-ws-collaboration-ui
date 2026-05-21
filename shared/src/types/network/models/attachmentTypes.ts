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
	messageId?: string;
	stanzaId?: string;
};

export type AdditionalHeaders = {
	description?: string;
	messageId?: string;
	replyId?: string;
	area?: string;
};

export type AttachmentsSortBy = 'created_at' | 'size';

export type AttachmentsSortOrder = 'asc' | 'desc';

export type GetRoomAttachmentsParams = {
	limit: number;
	cursor?: string;
	userId?: string;
	mimeType?: string;
	createdAfter?: string;
	createdBefore?: string;
	minSize?: number;
	maxSize?: number;
	sortBy?: AttachmentsSortBy;
	order?: AttachmentsSortOrder;
};

export type GetRoomAttachmentsResponse = {
	attachments: Array<Attachment>;
	cursor?: string;
};

export type BulkDeleteRoomAttachmentsResponse = {
	successIds: Array<string>;
	failedIds: Array<string>;
};
