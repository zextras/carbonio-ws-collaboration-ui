/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { pushHistory } from '@zextras/carbonio-shell-ui';
import { v4 as uuidGenerator } from 'uuid';

import BaseAPI from './BaseAPI';
import { ROUTES } from '../../hooks/useRouting';
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
	AddRoomMemberResponse,
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
	UpdateRoomPictureResponse,
	UpdateRoomResponse
} from '../../types/network/responses/roomsResponses';
import { ChangeUserPictureResponse } from '../../types/network/responses/usersResponses';
import { TextMessage } from '../../types/store/MessageTypes';
import { dateToISODate } from '../../utils/dateUtils';
import { MeetingsApi } from '../index';
import { getLastUnreadMessage } from '../xmpp/utility/getLastUnreadMessage';
import HistoryAccumulator from '../xmpp/utility/HistoryAccumulator';

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
		return this.fetchAPI('rooms', RequestType.POST, room).then((response: AddRoomResponse) => {
			// Create meeting for the created room
			const meetingType =
				room.type === RoomType.TEMPORARY ? MeetingType.SCHEDULED : MeetingType.PERMANENT;
			MeetingsApi.createMeeting(response.id, meetingType, response.name || '');
			return response;
		});
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
			text: optionalFields.description || '',
			replyTo: optionalFields.replyId,
			attachment: {
				id: 'placeholderFileId',
				name: file.name,
				mimeType: file.type,
				size: file.size,
				area: optionalFields.area
			}
		});

		return this.uploadFileFetchAPI(`rooms/${roomId}/attachments`, RequestType.POST, file, signal, {
			description: optionalFields.description,
			replyId: optionalFields.replyId,
			messageId: uuid,
			area: optionalFields.area
		})
			.then((resp: AddRoomAttachmentResponse) => resp)
			.catch((error) => {
				useStore.getState().removePlaceholderMessage(roomId, uuid);
				return Promise.reject(error);
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
		const promises = messages.map((message) =>
			xmppClient.requestMessageToForward(message.roomId, message.stanzaId).then(() => {
				const historyMessage = HistoryAccumulator.returnReferenceForForwardedMessage(
					message.stanzaId
				);
				if (historyMessage) {
					historyMessage.getElementsByTagName('body')[0].innerHTML = message.text;
					listOfMessages[message.stanzaId] = historyMessage.outerHTML;
				}
			})
		);

		return Promise.all(promises).then(() => {
			const messagesToForward = messages.map((message) => ({
				originalMessage: listOfMessages[message.stanzaId],
				originalMessageSentAt: dateToISODate(message.date)
			}));
			return Promise.all(
				roomsId.map((roomId) =>
					this.fetchAPI(`rooms/${roomId}/forward`, RequestType.POST, messagesToForward)
				)
			);
		});
	}

	public replacePlaceholderRoom(
		userId: string,
		text: string,
		file?: File
	): Promise<AddRoomResponse> {
		const { setPlaceholderMessage, replacePlaceholderRoom } = useStore.getState();
		setPlaceholderMessage({
			roomId: `placeholder-${userId}`,
			id: uuidGenerator(),
			text,
			attachment: file
				? { id: 'placeholderFileId', name: file.name, mimeType: file.type, size: file.size }
				: undefined
		});

		return this.addRoom({ type: RoomType.ONE_TO_ONE, membersIds: [userId] }).then((response) => {
			replacePlaceholderRoom(userId, response.id);
			pushHistory(ROUTES.ROOM.replace(':roomId', response.id));
			return response;
		});
	}
}

export default RoomsApi.getInstance();
