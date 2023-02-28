/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	DeleteAttachmentResponse,
	GetAttachmentInfoResponse,
	GetAttachmentPreviewResponse,
	GetAttachmentResponse
} from '../responses/attachmentsResponses';

interface IAttachmentsApi {
	deleteAttachment(fileId: string): Promise<DeleteAttachmentResponse>;
	getAttachmentInfo(fileId: string): Promise<GetAttachmentInfoResponse>;
	getURLAttachment(fileId: string): string;
	getAttachment(fileId: string): Promise<GetAttachmentResponse>;
	getAttachmentPreview(fileId: string): Promise<GetAttachmentPreviewResponse>;
	getURLPreview(fileId: string): string;
}

export default IAttachmentsApi;
