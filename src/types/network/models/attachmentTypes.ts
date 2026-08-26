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
	/**
	 * v2 (WSC-pure) only: client-generated correlation key for the optimistic
	 * placeholder — the MessageReceived self-echo carries it back. Sent both
	 * as a form field (the spike's contract) and as the X-Temp-Id header
	 * (the one api.yaml documents, on the binary variant).
	 */
	tempId?: string;
};

export type AttachmentsSortBy = 'created_at' | 'size';

export type AttachmentsSortOrder = 'asc' | 'desc';

export type MimeTypeCategory = 'IMAGES' | 'VIDEOS' | 'DOCUMENTS';

type MimeTypeFilter =
	| { mimeType?: string; mimeTypeCategory?: never }
	| { mimeType?: never; mimeTypeCategory?: MimeTypeCategory };

export type GetRoomAttachmentsParams = {
	limit: number;
	cursor?: string;
	userId?: string;
	createdAfter?: string;
	createdBefore?: string;
	minSize?: number;
	maxSize?: number;
	sortBy?: AttachmentsSortBy;
	order?: AttachmentsSortOrder;
} & MimeTypeFilter;

export type GetRoomAttachmentsResponse = {
	total?: number;
	attachments: Array<Attachment>;
	cursor?: string;
};

export type BulkDeleteRoomAttachmentsResponse = {
	successIds: Array<string>;
	failedIds: Array<string>;
};
