/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gte } from 'semver';

import { CHATS_ROUTE, QUOTA_CHANGED_EVENT } from '../../constants/appConstants';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import IRoomsApi from '../../types/network/apis/IRoomsApi';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import {
	AddMemberFields,
	RoomCreationFields,
	RoomEditableFields,
	RoomType
} from '../../types/network/models/roomBeTypes';
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
} from '../../types/network/responses/roomsResponses';
import { fetchAPI, sendFileFetchAPI, uploadFileFetchAPI } from '../../utils/FetchUtils';
import { createMeeting, deleteMeeting, ChatApi } from '../index';

class RoomsApi implements IRoomsApi {
	// Singleton design pattern
	private static instance: RoomsApi;

	public static getInstance(): RoomsApi {
		if (!RoomsApi.instance) {
			RoomsApi.instance = new RoomsApi();
		}
		return RoomsApi.instance;
	}

	public listRooms(): Promise<ListRoomsResponse> {
		// Returns basic room data without members or settings (RESTful approach)
		// For initial load, use ChatApi.getInbox() which includes room data with last messages
		// Members and settings should be fetched separately when needed via getRoomMembers/getRoom
		return fetchAPI<ListRoomsResponse>('rooms', RequestType.GET).then((resp) => {
			const { addRooms } = useStore.getState();
			addRooms(resp, true);
			return resp;
		});
	}

	public async addRoom(room: RoomCreationFields): Promise<AddRoomResponse> {
		return fetchAPI<AddRoomResponse>('rooms', RequestType.POST, room).then(async (response) => {
			// Add the newly created room to the store
			const { addRooms } = useStore.getState();
			addRooms([response]);

			// Create meeting for the created room
			const meetingType =
				room.type === RoomType.TEMPORARY ? MeetingType.SCHEDULED : MeetingType.PERMANENT;
			await createMeeting(response.id, meetingType, response.name ?? '');
			return response;
		});
	}

	public getRoom(roomId: string): Promise<GetRoomResponse> {
		return fetchAPI(`rooms/${roomId}`, RequestType.GET);
	}

	public updateRoom(
		roomId: string,
		editableFields: RoomEditableFields
	): Promise<UpdateRoomResponse> {
		return fetchAPI(`rooms/${roomId}`, RequestType.PUT, editableFields);
	}

	public deleteRoom(roomId: string): Promise<DeleteRoomResponse> {
		return fetchAPI(`rooms/${roomId}`, RequestType.DELETE);
	}

	public deleteRoomAndMeeting(roomId: string): Promise<DeleteRoomResponse> {
		const meetingId = useStore.getState().rooms[roomId]?.meetingId;
		if (meetingId) {
			return deleteMeeting(meetingId)
				.then(() => this.deleteRoom(roomId))
				.catch(() => this.deleteRoom(roomId));
		}
		return this.deleteRoom(roomId);
	}

	public getURLRoomPicture = (roomId: string): string =>
		`${window.document.location.origin}/services/chats/rooms/${roomId}/picture`;

	public getRoomPicture(roomId: string): Promise<GetRoomPictureResponse> {
		return fetchAPI(`rooms/${roomId}/picture`, RequestType.GET);
	}

	public updateRoomPicture(roomId: string, file: File): Promise<UpdateRoomPictureResponse> {
		return new Promise<UpdateRoomPictureResponse>((resolve, reject) => {
			const sizeLimit = useStore.getState().session.attributes?.maxRoomPictureSize;
			if (sizeLimit && file.size > sizeLimit * 1024 * 1024) {
				reject(new Error('File too large'));
			} else {
				uploadFileFetchAPI(`rooms/${roomId}/picture`, RequestType.PUT, file)
					.then((resp: UpdateRoomPictureResponse) => resolve(resp))
					.catch((error) => reject(new Error(error)));
			}
		});
	}

	public deleteRoomPicture(roomId: string): Promise<DeleteRoomPictureResponse> {
		return fetchAPI(`rooms/${roomId}/picture`, RequestType.DELETE);
	}

	public muteRoomNotification(roomId: string): Promise<MuteRoomResponse> {
		return fetchAPI(`rooms/${roomId}/mute`, RequestType.PUT);
	}

	public unmuteRoomNotification(roomId: string): Promise<UnmuteRoomResponse> {
		return fetchAPI(`rooms/${roomId}/mute`, RequestType.DELETE);
	}

	public clearRoomHistory(roomId: string): Promise<ClearRoomHistoryResponse> {
		return fetchAPI(`rooms/${roomId}/clear`, RequestType.PUT);
	}

	public getRoomMembers(roomId: string): Promise<GetRoomMembersResponse> {
		return fetchAPI(`rooms/${roomId}/members`, RequestType.GET);
	}

	public addRoomMembers(
		roomId: string,
		member: AddMemberFields[]
	): Promise<AddRoomMembersResponse> {
		return fetchAPI(`rooms/${roomId}/members`, RequestType.POST, member);
	}

	public deleteRoomMember(roomId: string, userId: string): Promise<DeleteRoomMemberResponse> {
		return fetchAPI(`rooms/${roomId}/members/${userId}`, RequestType.DELETE);
	}

	public promoteRoomMember(roomId: string, userId: string): Promise<PromoteRoomMemberResponse> {
		return fetchAPI(`rooms/${roomId}/members/${userId}/owner`, RequestType.PUT);
	}

	public demotesRoomMember(roomId: string, userId: string): Promise<DemotesRoomMemberResponse> {
		return fetchAPI(`rooms/${roomId}/members/${userId}/owner`, RequestType.DELETE);
	}

	public updateRoomOwners(roomId: string, userIds: string[]): Promise<UpdateRoomOwnersResponse> {
		return fetchAPI(`rooms/${roomId}/members/owners`, RequestType.PUT, { Members: userIds });
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
		return fetchAPI(`rooms/${roomId}/attachments${params}`, RequestType.GET);
	}

	public addRoomAttachment(
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
	): Promise<AddRoomAttachmentResponse> {
		// Check if this is a placeholder room
		const placeholderRoom = roomId.split('placeholder-');
		if (placeholderRoom[1]) {
			return this.replacePlaceholderRoom(placeholderRoom[1]).then((response) =>
				this.addRoomAttachment(response.id, file, optionalFields, signal)
			);
		}

		return new Promise<AddRoomAttachmentResponse>((resolve, reject) => {
			const { session } = useStore.getState();
			const sizeLimit = session.attributes?.maxAttachmentSize;
			if (sizeLimit && file.size > sizeLimit * 1024 * 1024) {
				reject(new Error('file_too_large'));
			} else {
				const optional = {
					description: optionalFields.description,
					replyId: optionalFields.replyId,
					area: optionalFields.area,
					text: optionalFields.text,
					replyToId: optionalFields.replyToId
				};
				// DEPRECATED: This check exists for backward compatibility with previous versions.
				//  * Remove once support for v1.6.0 is officially dropped.
				if (session.apiVersion && gte(session.apiVersion, '1.6.1')) {
					sendFileFetchAPI(`rooms/${roomId}/attachments`, RequestType.PUT, file, signal, optional)
						.then((resp: AddRoomAttachmentResponse) => {
							window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
							resolve(resp);
						})
						.catch((error) => {
							reject(new Error(error));
						});
				} else {
					uploadFileFetchAPI(
						`rooms/${roomId}/attachments`,
						RequestType.POST,
						file,
						signal,
						optional
					)
						.then((resp: AddRoomAttachmentResponse) => {
							window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
							resolve(resp);
						})
						.catch((error) => {
							reject(new Error(error));
						});
				}
			}
		});
	}

	/**
	 * Replaces a placeholder room with a real one.
	 * Creates the room via API, removes the placeholder, and redirects to the real room.
	 * @param userId The user ID that was used to create the placeholder
	 * @returns The response from the room creation API
	 */
	public replacePlaceholderRoom(userId: string): Promise<AddRoomResponse> {
		const { removePlaceholderRoom } = useStore.getState();

		return this.addRoom({
			type: RoomType.ONE_TO_ONE,
			members: [{ userId, owner: true }]
		}).then((response) => {
			removePlaceholderRoom(userId);
			sendCustomEvent({
				name: EventName.ROUTE_REDIRECT,
				data: {
					path: `/${CHATS_ROUTE}/${response.id}`
				}
			});
			return response;
		});
	}

}

export default RoomsApi.getInstance();
