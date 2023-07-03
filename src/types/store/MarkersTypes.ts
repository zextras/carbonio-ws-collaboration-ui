/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type MarkersMap = {
	[roomId: string]: RoomMarkers;
};
export type RoomMarkers = {
	[userId: string]: Marker;
};

export type Marker = {
	from: string;
	messageId: string;
	markerDate: number;
	type: MarkerType;
};

export enum MarkerStatus {
	READ = 'read',
	READ_BY_SOMEONE = 'read_by_someone',
	UNREAD = 'unread',
	PENDING = 'pending'
}

export enum MarkerType {
	DISPLAYED = 'displayed'
}
