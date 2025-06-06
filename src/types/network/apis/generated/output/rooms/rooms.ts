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
	ForwardMessagesRequestBody,
	InsertAttachmentRequestBody,
	InsertRoomMembersRequestBody,
	InsertRoomRequestBody,
	ListRoomAttachmentsInfoParams,
	ListRoomsParams,
	N200ClearRoomResponse,
	N200GetRoomPictureResponse,
	N200GetRoomResponse,
	N200InsertRoomMembersResponse,
	N200ListRoomAttachmentsInfoResponse,
	N200ListRoomsResponse,
	N200UpdateRoomOwnersResponse,
	N200UpdateRoomResponse,
	N201InsertAttachmentResponse,
	N201InsertRoomResponse,
	N204DeleteRoomPictureResponse,
	N204DeleteRoomResponse,
	N204ForwardMessagesResponse,
	N204MuteRoomResponse,
	N204UnmuteRoomResponse,
	N204UpdateRoomPictureResponse,
	UpdateRoomOwnersRequestBody,
	UpdateRoomPictureRequestBody,
	UpdateRoomRequestBody
} from '../api.schemas';

/**
 * @summary Retrieves a list of every room the user has access to
 */
export const getListRoomsUrl = (params?: ListRoomsParams) => {
	const normalizedParams = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value !== undefined) {
			normalizedParams.append(key, value === null ? 'null' : value.toString());
		}
	});

	const stringifiedParams = normalizedParams.toString();

	return stringifiedParams.length > 0 ? `/rooms?${stringifiedParams}` : `/rooms`;
};

export const listRooms = async (
	params?: ListRoomsParams,
	options?: RequestInit
): Promise<N200ListRoomsResponse> => {
	const res = await fetch(getListRoomsUrl(params), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200ListRoomsResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * Inserts a room of the specified type. The user performing the request will be included in the final members
list if not specified. If the room is a one-to-one, only a single member can be specified and name and
description are replaced with an empty string. If the room is not a one-to-one,
there must be at least two members specified.

 * @summary Insert a room of the specified type
 */
export const getInsertRoomUrl = () => `/rooms`;

export const insertRoom = async (
	insertRoomRequestBody: InsertRoomRequestBody,
	options?: RequestInit
): Promise<N201InsertRoomResponse> => {
	const res = await fetch(getInsertRoomUrl(), {
		...options,
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(insertRoomRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N201InsertRoomResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves the requested room
 */
export const getGetRoomUrl = (roomId: string) => `/rooms/${roomId}`;

export const getRoom = async (
	roomId: string,
	options?: RequestInit
): Promise<N200GetRoomResponse> => {
	const res = await fetch(getGetRoomUrl(roomId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetRoomResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Updates a room information
 */
export const getUpdateRoomUrl = (roomId: string) => `/rooms/${roomId}`;

export const updateRoom = async (
	roomId: string,
	updateRoomRequestBody: UpdateRoomRequestBody,
	options?: RequestInit
): Promise<N200UpdateRoomResponse> => {
	const res = await fetch(getUpdateRoomUrl(roomId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(updateRoomRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200UpdateRoomResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Deletes the specified room
 */
export const getDeleteRoomUrl = (roomId: string) => `/rooms/${roomId}`;

export const deleteRoom = async (
	roomId: string,
	options?: RequestInit
): Promise<N204DeleteRoomResponse> => {
	const res = await fetch(getDeleteRoomUrl(roomId), {
		...options,
		method: 'DELETE'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204DeleteRoomResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves the room picture
 */
export const getGetRoomPictureUrl = (roomId: string) => `/rooms/${roomId}/picture`;

export const getRoomPicture = async (
	roomId: string,
	options?: RequestInit
): Promise<N200GetRoomPictureResponse> => {
	const res = await fetch(getGetRoomPictureUrl(roomId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetRoomPictureResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Uploads and sets a new room picture
 */
export const getUpdateRoomPictureUrl = (roomId: string) => `/rooms/${roomId}/picture`;

export const updateRoomPicture = async (
	roomId: string,
	updateRoomPictureRequestBody: UpdateRoomPictureRequestBody,
	options?: RequestInit
): Promise<N204UpdateRoomPictureResponse> => {
	const res = await fetch(getUpdateRoomPictureUrl(roomId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/octet-stream', ...options?.headers },
		body: JSON.stringify(updateRoomPictureRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204UpdateRoomPictureResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Delete the room picture
 */
export const getDeleteRoomPictureUrl = (roomId: string) => `/rooms/${roomId}/picture`;

export const deleteRoomPicture = async (
	roomId: string,
	options?: RequestInit
): Promise<N204DeleteRoomPictureResponse> => {
	const res = await fetch(getDeleteRoomPictureUrl(roomId), {
		...options,
		method: 'DELETE'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204DeleteRoomPictureResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Mutes notification for the specified room
 */
export const getMuteRoomUrl = (roomId: string) => `/rooms/${roomId}/mute`;

export const muteRoom = async (
	roomId: string,
	options?: RequestInit
): Promise<N204MuteRoomResponse> => {
	const res = await fetch(getMuteRoomUrl(roomId), {
		...options,
		method: 'PUT'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204MuteRoomResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Unmutes notification for the specified room
 */
export const getUnmuteRoomUrl = (roomId: string) => `/rooms/${roomId}/mute`;

export const unmuteRoom = async (
	roomId: string,
	options?: RequestInit
): Promise<N204UnmuteRoomResponse> => {
	const res = await fetch(getUnmuteRoomUrl(roomId), {
		...options,
		method: 'DELETE'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204UnmuteRoomResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Clears all messages for the specified room
 */
export const getClearRoomHistoryUrl = (roomId: string) => `/rooms/${roomId}/clear`;

export const clearRoomHistory = async (
	roomId: string,
	options?: RequestInit
): Promise<N200ClearRoomResponse> => {
	const res = await fetch(getClearRoomHistoryUrl(roomId), {
		...options,
		method: 'PUT'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200ClearRoomResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * Add the specified users to the room. This can only be performed by an owner of the given room

 * @summary Add or invite the specified users to the room
 */
export const getInsertRoomMembersUrl = (roomId: string) => `/rooms/${roomId}/members`;

export const insertRoomMembers = async (
	roomId: string,
	insertRoomMembersRequestBody: InsertRoomMembersRequestBody,
	options?: RequestInit
): Promise<N200InsertRoomMembersResponse> => {
	const res = await fetch(getInsertRoomMembersUrl(roomId), {
		...options,
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(insertRoomMembersRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200InsertRoomMembersResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Update existing room owners
 */
export const getUpdateRoomOwnersUrl = (roomId: string) => `/rooms/${roomId}/members/owners`;

export const updateRoomOwners = async (
	roomId: string,
	updateRoomOwnersRequestBody: UpdateRoomOwnersRequestBody,
	options?: RequestInit
): Promise<N200UpdateRoomOwnersResponse> => {
	const res = await fetch(getUpdateRoomOwnersUrl(roomId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(updateRoomOwnersRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200UpdateRoomOwnersResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves paged list of metadata of every attachment uploaded to the room  and the filter for the next page
 */
export const getListRoomAttachmentsInfoUrl = (
	roomId: string,
	params?: ListRoomAttachmentsInfoParams
) => {
	const normalizedParams = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value !== undefined) {
			normalizedParams.append(key, value === null ? 'null' : value.toString());
		}
	});

	const stringifiedParams = normalizedParams.toString();

	return stringifiedParams.length > 0
		? `/rooms/${roomId}/attachments?${stringifiedParams}`
		: `/rooms/${roomId}/attachments`;
};

export const listRoomAttachmentsInfo = async (
	roomId: string,
	params?: ListRoomAttachmentsInfoParams,
	options?: RequestInit
): Promise<N200ListRoomAttachmentsInfoResponse> => {
	const res = await fetch(getListRoomAttachmentsInfoUrl(roomId, params), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200ListRoomAttachmentsInfoResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Insert an attachment
 */
export const getInsertAttachmentUrl = (roomId: string) => `/rooms/${roomId}/attachments`;

export const insertAttachment = async (
	roomId: string,
	insertAttachmentRequestBody: InsertAttachmentRequestBody,
	options?: RequestInit
): Promise<N201InsertAttachmentResponse> => {
	const res = await fetch(getInsertAttachmentUrl(roomId), {
		...options,
		method: 'POST',
		headers: { 'Content-Type': 'application/octet-stream', ...options?.headers },
		body: JSON.stringify(insertAttachmentRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N201InsertAttachmentResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Message forwarding
 */
export const getForwardMessagesUrl = (roomId: string) => `/rooms/${roomId}/forward`;

export const forwardMessages = async (
	roomId: string,
	forwardMessagesRequestBody: ForwardMessagesRequestBody,
	options?: RequestInit
): Promise<N204ForwardMessagesResponse> => {
	const res = await fetch(getForwardMessagesUrl(roomId), {
		...options,
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(forwardMessagesRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204ForwardMessagesResponse = body ? JSON.parse(body) : {};

	return data;
};
