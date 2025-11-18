/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gte } from 'semver';
import { v4 as uuidGenerator } from 'uuid';

import { CHATS_ROUTE } from '../../constants/appConstants';
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
	ForwardMessagesResponse,
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
import { TextMessage } from '../../types/store/ChatsRegistryTypes';
import { dateToISODate } from '../../utils/dateUtils';
import { fetchAPI, sendFileFetchAPI, uploadFileFetchAPI } from '../../utils/FetchUtils';
import { MeetingsApi } from '../index';
import { getLastUnreadMessage } from '../xmpp/utility/getLastUnreadMessage';
import HistoryAccumulator from '../xmpp/utility/HistoryAccumulator';

class RoomsApi implements IRoomsApi {
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
		return fetchAPI(`rooms${params}`, RequestType.GET).then((resp: ListRoomsResponse) => {
			const { addRooms } = useStore.getState();
			addRooms(resp);
			return resp;
		});
	}

	public async addRoom(room: RoomCreationFields): Promise<AddRoomResponse> {
		return fetchAPI('rooms', RequestType.POST, room).then(async (response: AddRoomResponse) => {
			// Create meeting for the created room
			const meetingType =
				room.type === RoomType.TEMPORARY ? MeetingType.SCHEDULED : MeetingType.PERMANENT;
			await MeetingsApi.createMeeting(response.id, meetingType, response.name ?? '');
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
			return MeetingsApi.deleteMeeting(meetingId)
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
		},
		signal?: AbortSignal
	): Promise<AddRoomAttachmentResponse> {
		const placeholderRoom = roomId.split('placeholder-');
		if (placeholderRoom[1]) {
			return this.replacePlaceholderRoom(
				placeholderRoom[1],
				optionalFields.description ?? '',
				file
			).then((response) => {
				this.addRoomAttachment(response.id, file, optionalFields, signal);
				return response;
			});
		}

		const { connections, setPlaceholderMessage } = useStore.getState();
		// Read messages before sending a new one
		const lastMessageId = getLastUnreadMessage(roomId);
		if (lastMessageId) connections.xmppClient.readMessage(roomId, lastMessageId);

		const uuid = uuidGenerator();
		// Set a placeholder message into the store
		setPlaceholderMessage({
			roomId,
			id: uuid,
			text: optionalFields.description ?? '',
			replyTo: optionalFields.replyId,
			attachment: {
				id: 'placeholderFileId',
				name: file.name,
				mimeType: file.type,
				size: file.size,
				area: optionalFields.area
			}
		});

		return new Promise<AddRoomAttachmentResponse>((resolve, reject) => {
			const { session, removePlaceholderMessage } = useStore.getState();
			const sizeLimit = session.attributes?.maxAttachmentSize;
			if (sizeLimit && file.size > sizeLimit * 1024 * 1024) {
				removePlaceholderMessage(roomId, uuid);
				reject(new Error('file_too_large'));
			} else {
				const optional = {
					description: optionalFields.description,
					replyId: optionalFields.replyId,
					area: optionalFields.area,
					messageId: uuid
				};
				// DEPRECATED: This check exists for backward compatibility with previous versions.
				//  * Remove once support for v1.6.0 is officially dropped.
				if (session.apiVersion && gte(session.apiVersion, '1.6.1')) {
					sendFileFetchAPI(`rooms/${roomId}/attachments`, RequestType.PUT, file, signal, optional)
						.then((resp: AddRoomAttachmentResponse) => resolve(resp))
						.catch((error) => {
							removePlaceholderMessage(roomId, uuid);
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
						.then((resp: AddRoomAttachmentResponse) => resolve(resp))
						.catch((error) => {
							removePlaceholderMessage(roomId, uuid);
							reject(new Error(error));
						});
				}
			}
		});
	}

	public forwardMessages(
		roomsId: string[],
		messages: TextMessage[]
	): Promise<ForwardMessagesResponse> {
		const { xmppClient } = useStore.getState().connections;
		const listOfMessages: { [stanzaId: string]: string } = {};

		// Get the XML messages to forward from history
		// We need to pass the text of actual message because if it is edited we won't pass the old text content
		const promises = messages.map((message) => {
			const queryId = HistoryAccumulator.getNextId();
			return xmppClient
				.requestMessageToForward(message.roomId, message.stanzaId, queryId)
				.then(() => {
					const historyMessage = HistoryAccumulator.getForwardedMessage(queryId);
					if (historyMessage) {
						historyMessage.getElementsByTagName('body')[0].textContent = message.text;
						listOfMessages[message.stanzaId] = historyMessage.outerHTML;
					}
				});
		});

		return Promise.all(promises).then(() => {
			const messagesToForward = messages.map((message) => ({
				originalMessage: listOfMessages[message.stanzaId],
				originalMessageSentAt: dateToISODate(message.date)
			}));
			return Promise.all(
				roomsId.map((roomId) =>
					fetchAPI(`rooms/${roomId}/forward`, RequestType.POST, messagesToForward)
				)
			);
		});
	}

	public replacePlaceholderRoom(
		userId: string,
		text: string,
		file?: File
	): Promise<AddRoomResponse> {
		const { setPlaceholderMessage, removePlaceholderRoom } = useStore.getState();
		setPlaceholderMessage({
			roomId: `placeholder-${userId}`,
			id: uuidGenerator(),
			text,
			attachment: file
				? { id: 'placeholderFileId', name: file.name, mimeType: file.type, size: file.size }
				: undefined
		});

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
