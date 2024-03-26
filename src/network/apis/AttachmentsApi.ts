/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import BaseAPI from './BaseAPI';
import IAttachmentsApi from '../../types/network/apis/IAttachmentsApi';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import {
	DeleteAttachmentResponse,
	GetAttachmentInfoResponse,
	GetAttachmentResponse,
	GetImageResponse,
	GetImageThumbnailResponse,
	GetPdfResponse,
	GetPdfThumbnailResponse,
	ImageSize
} from '../../types/network/responses/attachmentsResponses';

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

	public getImagePreview(
		fileId: string,
		area: string,
		quality?: string,
		format?: string
	): Promise<GetImageResponse> {
		let params = '';
		if (quality || format) {
			const array = [];
			if (quality) array.push(`quality=${quality}`);
			if (format) array.push(`output_format=${format}`);
			params = `?${array.join('&')}`;
		}
		return this.fetchAPI(`preview/image/${fileId}/${area}/${params}`, RequestType.GET);
	}

	public getImagePreviewURL = (
		fileId: string,
		area: string,
		quality?: string,
		format?: string
	): string => {
		let params = '';
		if (quality || format) {
			const array = [];
			if (quality) array.push(`quality=${quality}`);
			if (format) array.push(`output_format=${format}`);
			params = `?${array.join('&')}`;
		}
		return `${window.document.location.origin}/services/chats/preview/image/${fileId}/${area}/${params}`;
	};

	public getImageThumbnail(
		fileId: string,
		area: string,
		quality?: string,
		format?: string,
		shape?: string
	): Promise<GetImageThumbnailResponse> {
		let params = '';
		if (shape || quality || format) {
			const array = [];
			if (quality) array.push(`quality=${quality}`);
			if (format) array.push(`output_format=${format}`);
			if (shape) array.push(`shape=${shape}`);
			params = `?${array.join('&')}`;
		}
		return this.fetchAPI(`preview/image/${fileId}/${area}/thumbnail/${params}`, RequestType.GET);
	}

	public getImageThumbnailURL = (
		fileId: string,
		area: string,
		quality?: string,
		format?: string,
		shape?: string
	): string => {
		let params = '';
		if (shape || quality || format) {
			const array = [];
			if (quality) array.push(`quality=${quality}`);
			if (format) array.push(`output_format=${format}`);
			if (shape) array.push(`shape=${shape}`);
			params = `?${array.join('&')}`;
		}
		return `${window.document.location.origin}/services/chats/preview/image/${fileId}/${area}/thumbnail/${params}`;
	};

	public getPdfPreview(
		fileId: string,
		firstPage?: number,
		lastPage?: number
	): Promise<GetPdfResponse> {
		let params = '';
		if (firstPage || lastPage) {
			const array = [];
			if (firstPage) array.push(`first_page=${firstPage}`);
			if (lastPage) array.push(`last_page=${lastPage}`);
			params = `?${array.join('&')}`;
		}
		return this.fetchAPI(`preview/pdf/${fileId}/${params}`, RequestType.GET);
	}

	public getPdfPreviewURL = (fileId: string, firstPage?: number, lastPage?: number): string => {
		let params = '';
		if (firstPage || lastPage) {
			const array = [];
			if (firstPage) array.push(`first_page=${firstPage}`);
			if (lastPage) array.push(`last_page=${lastPage}`);
			params = `?${array.join('&')}`;
		}
		return `${window.document.location.origin}/services/chats/preview/pdf/${fileId}/${params}`;
	};

	public getPdfThumbnail(
		fileId: string,
		area: string,
		quality?: string,
		shape?: string,
		format?: string
	): Promise<GetPdfThumbnailResponse> {
		let params = '';
		if (shape || quality || format) {
			const array = [];
			if (shape) array.push(`shape=${shape}`);
			if (quality) array.push(`quality=${quality}`);
			if (format) array.push(`output_format=${format}`);
			params = `?${array.join('&')}`;
		}
		return this.fetchAPI(`preview/pdf/${fileId}/${area}/thumbnail/${params}`, RequestType.GET);
	}

	public getPdfThumbnailURL = (
		fileId: string,
		area: string,
		quality?: string,
		shape?: string,
		format?: string
	): string => {
		let params = '';
		if (shape || quality || format) {
			const array = [];
			if (shape) array.push(`shape=${shape}`);
			if (quality) array.push(`quality=${quality}`);
			if (format) array.push(`output_format=${format}`);
			params = `?${array.join('&')}`;
		}
		return `${window.document.location.origin}/services/chats/preview/pdf/${fileId}/${area}/thumbnail/${params}`;
	};

	public getImageSize(url: string): Promise<ImageSize> {
		return new Promise((resolve, reject) => {
			try {
				const img = new Image();

				img.addEventListener(
					'load',
					() => {
						resolve({ width: img.naturalWidth, height: img.naturalHeight });
					},
					{ once: true }
				);

				img.src = url;
			} catch (err) {
				reject(err);
			}
		});
	}
}

export default AttachmentsApi.getInstance();
