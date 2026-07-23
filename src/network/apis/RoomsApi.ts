/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gte } from 'semver';
import { v4 as uuidv4 } from 'uuid';

import { CHATS_ROUTE, QUOTA_CHANGED_EVENT } from '../../constants/appConstants';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
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
	BulkDeleteRoomAttachmentsResponse,
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
import { GetRoomAttachmentsParams } from '../../types/network/models/attachmentTypes';
import { TextMessage } from '../../types/store/ChatsRegistryTypes';
import { dateToISODate } from '../../utils/dateUtils';
import { buildQueryString, fetchAPI, sendFileFetchAPI, uploadFileFetchAPI } from '../../utils/FetchUtils';
import { createMeeting, deleteMeeting } from '../index';
import HistoryAccumulator from '../xmpp/utility/HistoryAccumulator';
import { xmppClient } from '../xmpp/XMPPClient';

export const listRooms = (members = false, settings = false): Promise<ListRoomsResponse> => {
	let paramsStr = '';
	if (members || settings) {
		const array = [];
		if (members) array.push('extraFields=members');
		if (settings) array.push('extraFields=settings');
		paramsStr = `?${array.join('&')}`;
	}
	return fetchAPI<ListRoomsResponse>(`rooms${paramsStr}`, RequestType.GET).then((resp) => {
		const { addRooms } = useStore.getState();
		addRooms(resp, true);
		return resp;
	});
};

export const addRoom = async (room: RoomCreationFields): Promise<AddRoomResponse> =>
	fetchAPI<AddRoomResponse>('rooms', RequestType.POST, room).then(async (response) => {
		// Add the newly created room to the store
		const { addRooms } = useStore.getState();
		addRooms([response]);

		// Create meeting for the created room
		const meetingType =
			room.type === RoomType.TEMPORARY ? MeetingType.SCHEDULED : MeetingType.PERMANENT;
		await createMeeting(response.id, meetingType, response.name ?? '');
		return response;
	});

export const getRoom = (roomId: string): Promise<GetRoomResponse> =>
	fetchAPI(`rooms/${roomId}`, RequestType.GET);

export const updateRoom = (
	roomId: string,
	editableFields: RoomEditableFields
): Promise<UpdateRoomResponse> => fetchAPI(`rooms/${roomId}`, RequestType.PUT, editableFields);

export const deleteRoom = (roomId: string): Promise<DeleteRoomResponse> =>
	fetchAPI(`rooms/${roomId}`, RequestType.DELETE);

export const deleteRoomAndMeeting = (roomId: string): Promise<DeleteRoomResponse> => {
	const meetingId = useStore.getState().rooms[roomId]?.meetingId;
	if (meetingId) {
		return deleteMeeting(meetingId)
			.then(() => deleteRoom(roomId))
			.catch(() => deleteRoom(roomId));
	}
	return deleteRoom(roomId);
};

export const getURLRoomPicture = (roomId: string): string =>
	`${window.document.location.origin}/services/chats/rooms/${roomId}/picture`;

export const getRoomPicture = (roomId: string): Promise<GetRoomPictureResponse> =>
	fetchAPI(`rooms/${roomId}/picture`, RequestType.GET);

export const updateRoomPicture = (roomId: string, file: File): Promise<UpdateRoomPictureResponse> =>
	new Promise<UpdateRoomPictureResponse>((resolve, reject) => {
		const sizeLimit = useStore.getState().session.attributes?.maxRoomPictureSize;
		if (sizeLimit && file.size > sizeLimit * 1024 * 1024) {
			reject(new Error('File too large'));
		} else {
			uploadFileFetchAPI(`rooms/${roomId}/picture`, RequestType.PUT, file)
				.then((resp: UpdateRoomPictureResponse) => resolve(resp))
				.catch((error) => reject(new Error(error)));
		}
	});

export const deleteRoomPicture = (roomId: string): Promise<DeleteRoomPictureResponse> =>
	fetchAPI(`rooms/${roomId}/picture`, RequestType.DELETE);

export const muteRoomNotification = (roomId: string): Promise<MuteRoomResponse> =>
	fetchAPI(`rooms/${roomId}/mute`, RequestType.PUT);

export const unmuteRoomNotification = (roomId: string): Promise<UnmuteRoomResponse> =>
	fetchAPI(`rooms/${roomId}/mute`, RequestType.DELETE);

export const clearRoomHistory = (roomId: string): Promise<ClearRoomHistoryResponse> =>
	fetchAPI(`rooms/${roomId}/clear`, RequestType.PUT);

export const getRoomMembers = (roomId: string): Promise<GetRoomMembersResponse> =>
	fetchAPI(`rooms/${roomId}/members`, RequestType.GET);

export const addRoomMembers = (
	roomId: string,
	member: AddMemberFields[]
): Promise<AddRoomMembersResponse> => fetchAPI(`rooms/${roomId}/members`, RequestType.POST, member);

export const deleteRoomMember = (
	roomId: string,
	userId: string
): Promise<DeleteRoomMemberResponse> =>
	fetchAPI(`rooms/${roomId}/members/${userId}`, RequestType.DELETE);

export const promoteRoomMember = (
	roomId: string,
	userId: string
): Promise<PromoteRoomMemberResponse> =>
	fetchAPI(`rooms/${roomId}/members/${userId}/owner`, RequestType.PUT);

export const demotesRoomMember = (
	roomId: string,
	userId: string
): Promise<DemotesRoomMemberResponse> =>
	fetchAPI(`rooms/${roomId}/members/${userId}/owner`, RequestType.DELETE);

export const updateRoomOwners = (
	roomId: string,
	userIds: string[]
): Promise<UpdateRoomOwnersResponse> =>
	fetchAPI(`rooms/${roomId}/members/owners`, RequestType.PUT, { Members: userIds });

export const getRoomAttachments = (
	roomId: string,
	params: GetRoomAttachmentsParams
): Promise<GetRoomAttachmentsResponse> =>
	fetchAPI(`rooms/${roomId}/attachments${buildQueryString({ ...params })}`, RequestType.GET);

export const bulkDeleteRoomAttachments = (
	roomId: string,
	attachmentIds: string[]
): Promise<BulkDeleteRoomAttachmentsResponse> =>
	fetchAPI(`rooms/${roomId}/attachments`, RequestType.DELETE, { attachmentIds } as unknown as Record<string, unknown>);

/**
 * Replaces a placeholder room with a real one.
 * Creates the room via API, atomically swaps placeholder→real room in the store
 * (both store ops are synchronous so React 18 batches them into a single render,
 * preventing the ~0.5 s double-room flash caused by addRooms+createMeeting+removePlaceholder),
 * then creates the meeting and redirects.
 * @param userId The user ID that was used to create the placeholder
 * @returns The response from the room creation API
 */
export const replacePlaceholderRoom = (userId: string): Promise<AddRoomResponse> =>
	fetchAPI<AddRoomResponse>('rooms', RequestType.POST, {
		type: RoomType.ONE_TO_ONE,
		members: [{ userId, owner: true }]
	}).then(async (response) => {
		// Atomic swap: remove placeholder and insert real room in two synchronous store
		// updates. React 18 automatic batching merges them into one render pass so the
		// two rooms never coexist from the UI's perspective.
		const { removePlaceholderRoom, addRooms } = useStore.getState();
		removePlaceholderRoom(userId);
		addRooms([response]);

		// Meeting creation happens after the swap so the real room is already visible
		// before the ~0.5 s network round-trip completes.
		await createMeeting(response.id, MeetingType.PERMANENT, response.name ?? '');

		sendCustomEvent({
			name: EventName.ROUTE_REDIRECT,
			data: {
				path: `/${CHATS_ROUTE}/${response.id}`
			}
		});
		return response;
	});

export const addRoomAttachment = (
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
): Promise<AddRoomAttachmentResponse> => {
	// Check if this is a placeholder room
	const placeholderRoom = roomId.split('placeholder-');
	if (placeholderRoom[1]) {
		return replacePlaceholderRoom(placeholderRoom[1]).then((response) =>
			addRoomAttachment(response.id, file, optionalFields, signal)
		);
	}

	const tempId = uuidv4();

	useStore.getState().setPlaceholderMessage({
		id: tempId,
		roomId,
		text: optionalFields.description ?? file.name,
		replyTo: optionalFields.replyId,
		attachment: {
			id: tempId,
			name: file.name,
			mimeType: file.type || 'application/octet-stream',
			size: file.size
		},
		tempId
	});

	return new Promise<AddRoomAttachmentResponse>((resolve, reject) => {
		const { session } = useStore.getState();
		const sizeLimit = session.attributes?.maxAttachmentSize;
		if (sizeLimit && file.size > sizeLimit * 1024 * 1024) {
			useStore.getState().removePlaceholderMessage(roomId, tempId);
			reject(new Error('file_too_large'));
		} else {
			const optional = {
				description: optionalFields.description,
				replyId: optionalFields.replyId,
				area: optionalFields.area,
				text: optionalFields.text,
				replyToId: optionalFields.replyToId,
				// devel legacy parity: messageId is the sole optimistic-correlation handle on the
				// MongooseIM backend (it becomes the XMPP stanza id). The new path uses tempId.
				// The backend accepts both harmlessly, so we send both set to the same client UUID.
				messageId: tempId,
				tempId
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
						useStore.getState().removePlaceholderMessage(roomId, tempId);
						reject(new Error(error));
					});
			} else {
				uploadFileFetchAPI(`rooms/${roomId}/attachments`, RequestType.POST, file, signal, optional)
					.then((resp: AddRoomAttachmentResponse) => {
						window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
						resolve(resp);
					})
					.catch((error) => {
						useStore.getState().removePlaceholderMessage(roomId, tempId);
						reject(new Error(error));
					});
			}
		}
	});
};

/**
 * XMPP-backend implementation of forward messages.
 * Used when isMongooseIM is true; REST callers use ChatApi.forwardMessages instead.
 */
export const xmppForwardMessages = (
	roomsId: string[],
	messages: TextMessage[]
): Promise<Response[]> => {
	const listOfMessages: { [stanzaId: string]: string } = {};

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
		const hasAttachments = messages.some((message) => message.attachment);
		return Promise.allSettled(
			roomsId.map((roomId) =>
				fetchAPI<Response>(`rooms/${roomId}/forward`, RequestType.POST, messagesToForward)
			)
		).then((results) => {
			const fulfilled = results.filter(
				(r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled'
			);
			if (hasAttachments && fulfilled.length > 0) {
				window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
			}
			const rejected = results.find((r) => r.status === 'rejected');
			if (rejected) {
				throw rejected.reason;
			}
			return fulfilled.map((r) => r.value);
		});
	});
};

// Default export: namespace object for backward-compat with jest.spyOn in test mocks.
// Callers should prefer the named exports above.
const roomsApiNamespace = {
	listRooms,
	addRoom,
	getRoom,
	updateRoom,
	deleteRoom,
	deleteRoomAndMeeting,
	getURLRoomPicture,
	getRoomPicture,
	updateRoomPicture,
	deleteRoomPicture,
	muteRoomNotification,
	unmuteRoomNotification,
	clearRoomHistory,
	getRoomMembers,
	addRoomMembers,
	deleteRoomMember,
	promoteRoomMember,
	demotesRoomMember,
	updateRoomOwners,
	getRoomAttachments,
	bulkDeleteRoomAttachments,
	replacePlaceholderRoom,
	addRoomAttachment
};

export default roomsApiNamespace;
