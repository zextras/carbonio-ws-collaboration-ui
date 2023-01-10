/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AddMemberFields, RoomCreationFields, RoomEditableFields } from '../models/roomBeTypes';
import {
	AddRoomAttachmentResponse,
	AddRoomMemberResponse,
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
	ResetRoomHashResponse,
	UnmuteRoomResponse,
	UpdateRoomPictureResponse,
	UpdateRoomResponse
} from '../responses/roomsResponses';

interface IRoomsApi {
	// Room list
	listRooms(members: boolean, settings: boolean): Promise<ListRoomsResponse>;
	addRoom(room: RoomCreationFields): Promise<AddRoomResponse>;
	getRoom(roomId: string): Promise<GetRoomResponse>;
	updateRoom(roomId: string, editableFields: RoomEditableFields): Promise<UpdateRoomResponse>;
	deleteRoom(roomId: string): Promise<DeleteRoomResponse>;
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
	// Hash
	resetRoomHash(roomId: string): Promise<ResetRoomHashResponse>;
	// Room members
	getRoomMembers(roomId: string): Promise<GetRoomMembersResponse>;
	addRoomMember(roomId: string, member: AddMemberFields): Promise<AddRoomMemberResponse>;
	deleteRoomMember(roomId: string, userId: string): Promise<DeleteRoomMemberResponse>;
	promoteRoomMember(roomId: string, userId: string): Promise<PromoteRoomMemberResponse>;
	demotesRoomMember(roomId: string, userId: string): Promise<DemotesRoomMemberResponse>;
	// Room attachments
	getRoomAttachments(
		roomId: string,
		pageNumber: number,
		pageFilter: string
	): Promise<GetRoomAttachmentsResponse>;
	addRoomAttachment(roomId: string, file: File): Promise<AddRoomAttachmentResponse>;
}

export default IRoomsApi;