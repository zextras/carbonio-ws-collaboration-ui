/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import IAttachmentsApi from '../../types/network/apis/IAttachmentsApi';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import {
	DeleteAttachmentResponse,
	GetAttachmentInfoResponse,
	GetAttachmentPreviewResponse,
	GetAttachmentResponse
} from '../../types/network/responses/attachmentsResponses';
import BaseAPI from './BaseAPI';

class AttachmentsApi extends BaseAPI implements IAttachmentsApi {
	// Singleton design pattern
	private static instance: IAttachmentsApi;

	public static getInstance(): IAttachmentsApi {
		if (!AttachmentsApi.instance) {
			AttachmentsApi.instance = new AttachmentsApi();
		}
		return AttachmentsApi.instance;
	}

	public deleteAttachment(fileId: string): Promise<DeleteAttachmentResponse> {
		return this.fetchAPI(`attachments/${fileId}`, RequestType.DELETE);
	}

	public getAttachmentInfo(fileId: string): Promise<GetAttachmentInfoResponse> {
		return this.fetchAPI(`attachments/${fileId}`, RequestType.GET);
	}

	public getURLAttachment = (fileId: string): string =>
		`${window.document.location.origin}/services/chats/attachments/${fileId}/download`;

	public getAttachment(fileId: string): Promise<GetAttachmentResponse> {
		return this.fetchAPI(`attachments/${fileId}/download`, RequestType.GET);
	}

	public getAttachmentPreview(fileId: string): Promise<GetAttachmentPreviewResponse> {
		return this.fetchAPI(`attachments/${fileId}/preview`, RequestType.GET);
	}

	public getURLPreview = (fileId: string): string =>
		`${window.document.location.origin}/services/chats/attachments/${fileId}/preview`;
}

export default AttachmentsApi.getInstance();
