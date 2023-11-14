/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../models/attachmentTypes';
import { MemberBe, RoomBe } from '../models/roomBeTypes';

export type ListRoomsResponse = RoomBe[];

export type AddRoomResponse = RoomBe;

export type GetRoomResponse = RoomBe;

export type UpdateRoomResponse = RoomBe;

export type DeleteRoomResponse = Response;

export type GetRoomPictureResponse = Blob;

export type UpdateRoomPictureResponse = Response;

export type DeleteRoomPictureResponse = Response;

export type MuteRoomResponse = Response;

export type UnmuteRoomResponse = Response;

export type ClearRoomHistoryResponse = {
	clearedAt: string;
};

export type GetRoomMembersResponse = ''; // TODO

export type AddRoomMemberResponse = MemberBe;

export type DeleteRoomMemberResponse = Response;

export type PromoteRoomMemberResponse = Response;

export type DemotesRoomMemberResponse = Response;

export type GetRoomAttachmentsResponse = {
	attachments: Attachment[];
};

export type AddRoomAttachmentResponse = {
	id: string;
};

export type ForwardMessagesResponse = Response[];
