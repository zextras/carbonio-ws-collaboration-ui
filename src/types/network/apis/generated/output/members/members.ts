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
	N200ListRoomMembersResponse,
	N204DeleteOwnerResponse,
	N204DeleteRoomMemberResponse,
	N204InsertOwnerResponse
} from '../api.schemas';

/**
 * @summary Retrieves every member to the given room
 */
export const getListRoomMembersUrl = (roomId: string) => `/rooms/${roomId}/members`;

export const listRoomMembers = async (
	roomId: string,
	options?: RequestInit
): Promise<N200ListRoomMembersResponse> => {
	const res = await fetch(getListRoomMembersUrl(roomId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200ListRoomMembersResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * Removes a member from the specified room. If the specified user is different from
the requester, this action is considered as a kick

 * @summary Removes a member from the room
 */
export const getDeleteRoomMemberUrl = (roomId: string, userId: string) =>
	`/rooms/${roomId}/members/${userId}`;

export const deleteRoomMember = async (
	roomId: string,
	userId: string,
	options?: RequestInit
): Promise<N204DeleteRoomMemberResponse> => {
	const res = await fetch(getDeleteRoomMemberUrl(roomId, userId), {
		...options,
		method: 'DELETE'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204DeleteRoomMemberResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Promotes a member to owner
 */
export const getInsertOwnerUrl = (roomId: string, userId: string) =>
	`/rooms/${roomId}/members/${userId}/owner`;

export const insertOwner = async (
	roomId: string,
	userId: string,
	options?: RequestInit
): Promise<N204InsertOwnerResponse> => {
	const res = await fetch(getInsertOwnerUrl(roomId, userId), {
		...options,
		method: 'PUT'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204InsertOwnerResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Demotes a member from owner to normal member
 */
export const getDeleteOwnerUrl = (roomId: string, userId: string) =>
	`/rooms/${roomId}/members/${userId}/owner`;

export const deleteOwner = async (
	roomId: string,
	userId: string,
	options?: RequestInit
): Promise<N204DeleteOwnerResponse> => {
	const res = await fetch(getDeleteOwnerUrl(roomId, userId), {
		...options,
		method: 'DELETE'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204DeleteOwnerResponse = body ? JSON.parse(body) : {};

	return data;
};
