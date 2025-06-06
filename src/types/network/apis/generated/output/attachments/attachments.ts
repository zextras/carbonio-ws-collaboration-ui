/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
/**
 * Zextras Carbonio Workstream Collaboration API
 * Zextras Carbonio Workstream Collaboration HTTP APIs definition.
 * OpenAPI spec version: 1.6.0
 */
import type {
	N200GetAttachmentInfoResponse,
	N200GetAttachmentResponse,
	N204DeleteAttachmentResponse
} from '../api.schemas';

/**
 * @summary Deletes an uploaded attachment
 */
export const getDeleteAttachmentUrl = (fileId: string) => `/attachments/${fileId}`;

export const deleteAttachment = async (
	fileId: string,
	options?: RequestInit
): Promise<N204DeleteAttachmentResponse> => {
	const res = await fetch(getDeleteAttachmentUrl(fileId), {
		...options,
		method: 'DELETE'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204DeleteAttachmentResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves info related to an uploaded attachment
 */
export const getGetAttachmentInfoUrl = (fileId: string) => `/attachments/${fileId}`;

export const getAttachmentInfo = async (
	fileId: string,
	options?: RequestInit
): Promise<N200GetAttachmentInfoResponse> => {
	const res = await fetch(getGetAttachmentInfoUrl(fileId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetAttachmentInfoResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves an uploaded attachment
 */
export const getGetAttachmentUrl = (fileId: string) => `/attachments/${fileId}/download`;

export const getAttachment = async (
	fileId: string,
	options?: RequestInit
): Promise<N200GetAttachmentResponse> => {
	const res = await fetch(getGetAttachmentUrl(fileId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetAttachmentResponse = body ? JSON.parse(body) : {};

	return data;
};
