/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import IRoomsApi from '../../types/network/apis/IRoomsApi';
import {
	AddMemberFields,
	RoomCreationFields,
	RoomEditableFields
} from '../../types/network/models/roomBeTypes';
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
} from '../../types/network/responses/roomsResponses';
import { ChangeUserPictureResponse } from '../../types/network/responses/usersResponses';
import BaseAPI from './BaseAPI';

class RoomsApi extends BaseAPI implements IRoomsApi {
	// Singleton design pattern
	private static instance: RoomsApi;

	public static getInstance(): RoomsApi {
		if (!RoomsApi.instance) {
			RoomsApi.instance = new RoomsApi();
		}
		return RoomsApi.instance;
	}

	public listRooms(members = false, settings = false): Promise<ListRoomsResponse> {
		let params = '';
		if (members || settings) {
			const array = [];
			if (members) array.push('extraFields=members');
			if (settings) array.push('extraFields=settings');
			params = `?${array.join('&')}`;
		}
		return this.fetchAPI(`rooms${params}`, RequestType.GET).then((resp: ListRoomsResponse) => {
			const { setRooms } = useStore.getState();
			setRooms(resp);
			return resp;
		});
	}

	public addRoom(room: RoomCreationFields): Promise<AddRoomResponse> {
		return this.fetchAPI('rooms', RequestType.POST, room);
	}

	public getRoom(roomId: string): Promise<GetRoomResponse> {
		return this.fetchAPI(`rooms/${roomId}`, RequestType.GET);
	}

	public updateRoom(
		roomId: string,
		editableFields: RoomEditableFields
	): Promise<UpdateRoomResponse> {
		return this.fetchAPI(`rooms/${roomId}`, RequestType.PUT, editableFields);
	}

	public deleteRoom(roomId: string): Promise<DeleteRoomResponse> {
		return this.fetchAPI(`rooms/${roomId}`, RequestType.DELETE);
	}

	public getURLRoomPicture = (roomId: string): string =>
		`${window.document.location.origin}/services/chats/rooms/${roomId}/picture`;

	public getRoomPicture(roomId: string): Promise<GetRoomPictureResponse> {
		return this.fetchAPI(`rooms/${roomId}/picture`, RequestType.GET);
	}

	public updateRoomPicture(roomId: string, file: File): Promise<UpdateRoomPictureResponse> {
		return new Promise<ChangeUserPictureResponse>((resolve, reject) => {
			const sizeLimit = useStore.getState().session.capabilities?.maxRoomImageSizeInKb;
			if (sizeLimit && file.size > sizeLimit * 1000) {
				reject(new Error('File too large'));
			} else {
				this.uploadFileFetchAPI(`rooms/${roomId}/picture`, RequestType.PUT, file)
					.then((resp: UpdateRoomPictureResponse) => resolve(resp))
					.catch((error) => reject(error));
			}
		});
	}

	public deleteRoomPicture(roomId: string): Promise<DeleteRoomPictureResponse> {
		return this.fetchAPI(`rooms/${roomId}/picture`, RequestType.DELETE);
	}

	public muteRoomNotification(roomId: string): Promise<MuteRoomResponse> {
		return this.fetchAPI(`rooms/${roomId}/mute`, RequestType.PUT);
	}

	public unmuteRoomNotification(roomId: string): Promise<UnmuteRoomResponse> {
		return this.fetchAPI(`rooms/${roomId}/mute`, RequestType.DELETE);
	}

	public clearRoomHistory(roomId: string): Promise<ClearRoomHistoryResponse> {
		return this.fetchAPI(`rooms/${roomId}/clear`, RequestType.PUT);
	}

	public resetRoomHash(roomId: string): Promise<ResetRoomHashResponse> {
		return this.fetchAPI(`rooms/${roomId}/hash`, RequestType.PUT);
	}

	public getRoomMembers(roomId: string): Promise<GetRoomMembersResponse> {
		return this.fetchAPI(`rooms/${roomId}/members`, RequestType.GET);
	}

	public addRoomMember(roomId: string, member: AddMemberFields): Promise<AddRoomMemberResponse> {
		return this.fetchAPI(`rooms/${roomId}/members`, RequestType.POST, member);
	}

	public deleteRoomMember(roomId: string, userId: string): Promise<DeleteRoomMemberResponse> {
		return this.fetchAPI(`rooms/${roomId}/members/${userId}`, RequestType.DELETE);
	}

	public promoteRoomMember(roomId: string, userId: string): Promise<PromoteRoomMemberResponse> {
		return this.fetchAPI(`rooms/${roomId}/members/${userId}/owner`, RequestType.PUT);
	}

	public demotesRoomMember(roomId: string, userId: string): Promise<DemotesRoomMemberResponse> {
		return this.fetchAPI(`rooms/${roomId}/members/${userId}/owner`, RequestType.DELETE);
	}

	public getRoomAttachments(
		roomId: string,
		pageNumber?: number,
		pageFilter?: string
	): Promise<GetRoomAttachmentsResponse> {
		let params = '';
		if (pageNumber || pageFilter) {
			const array = [];
			if (pageNumber) array.push(`itemsNumber=${pageNumber}`);
			if (pageFilter) array.push(`extraFields=${pageFilter}`);
			params = `?${array.join('&')}`;
		}
		return this.fetchAPI(`rooms/${roomId}/attachments${params}`, RequestType.GET);
	}

	public addRoomAttachment(
		roomId: string,
		file: File,
		description?: string,
		signal?: AbortSignal
	): Promise<AddRoomAttachmentResponse> {
		return this.uploadFileFetchAPI(
			`rooms/${roomId}/attachments`,
			RequestType.POST,
			file,
			description,
			signal
		);
	}
}

export default RoomsApi.getInstance();
