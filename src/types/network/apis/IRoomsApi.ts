/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AddMemberFields, RoomCreationFields, RoomEditableFields } from '../models/roomBeTypes';
import {
	AddRoomAttachmentResponse,
	AddRoomMembersResponse,
	AddRoomResponse,
	ClearRoomHistoryResponse,
	DeleteRoomMemberResponse,
	DeleteRoomPictureResponse,
	DeleteRoomResponse,
	DemotesRoomMemberResponse,
	GetRoomAttachmentsResponse,
	GetRoomMembersResponse,
	GetRoomPictureResponse,
	GetRoomResponse,
	ListRoomsResponse,
	MuteRoomResponse,
	PromoteRoomMemberResponse,
	UnmuteRoomResponse,
	UpdateRoomOwnersResponse,
	UpdateRoomPictureResponse,
	UpdateRoomResponse
} from '../responses/roomsResponses';

interface IRoomsApi {
	// Room list - returns basic room data, use ChatApi.getInbox() for initial load with last messages
	listRooms(): Promise<ListRoomsResponse>;
	addRoom(room: RoomCreationFields): Promise<AddRoomResponse>;
	getRoom(roomId: string): Promise<GetRoomResponse>;
	updateRoom(roomId: string, editableFields: RoomEditableFields): Promise<UpdateRoomResponse>;
	deleteRoom(roomId: string): Promise<DeleteRoomResponse>;
	deleteRoomAndMeeting(roomId: string): Promise<DeleteRoomResponse>;
	// Room picture
	getURLRoomPicture(roomId: string): string;
	getRoomPicture(roomId: string): Promise<GetRoomPictureResponse>;
	updateRoomPicture(roomId: string, file: File): Promise<UpdateRoomPictureResponse>;
	deleteRoomPicture(roomId: string): Promise<DeleteRoomPictureResponse>;
	// Mute notification
	muteRoomNotification(roomId: string): Promise<MuteRoomResponse>;
	unmuteRoomNotification(roomId: string): Promise<UnmuteRoomResponse>;
	// Clear history
	clearRoomHistory(roomId: string): Promise<ClearRoomHistoryResponse>;
	// Room members
	getRoomMembers(roomId: string): Promise<GetRoomMembersResponse>;
	addRoomMembers(roomId: string, member: AddMemberFields[]): Promise<AddRoomMembersResponse>;
	deleteRoomMember(roomId: string, userId: string): Promise<DeleteRoomMemberResponse>;
	promoteRoomMember(roomId: string, userId: string): Promise<PromoteRoomMemberResponse>;
	demotesRoomMember(roomId: string, userId: string): Promise<DemotesRoomMemberResponse>;
	updateRoomOwners(roomId: string, userIds: string[]): Promise<UpdateRoomOwnersResponse>;
	// Room attachments
	getRoomAttachments(
		roomId: string,
		pageNumber: number,
		pageFilter: string
	): Promise<GetRoomAttachmentsResponse>;
	addRoomAttachment(
		roomId: string,
		file: File,
		optionalFields: {
			description?: string;
			replyId?: string;
			area?: string;
			text?: string;
			replyToId?: string;
		},
		signal?: AbortSignal
	): Promise<AddRoomAttachmentResponse>;
}

export default IRoomsApi;
