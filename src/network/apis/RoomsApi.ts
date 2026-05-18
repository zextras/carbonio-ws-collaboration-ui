/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { gte } from 'semver';
import { v4 as uuidGenerator } from 'uuid';

import { createMeeting, deleteMeeting } from './MeetingsApi';
import { CHATS_ROUTE, QUOTA_CHANGED_EVENT } from '../../constants/appConstants';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import {
	BulkDeleteRoomAttachmentsResponse,
	GetRoomAttachmentsParams,
	GetRoomAttachmentsResponse
} from '../../types/network/models/attachmentTypes';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import {
	AddMemberFields,
	MemberBe,
	RoomBe,
	RoomCreationFields,
	RoomEditableFields,
	RoomType
} from '../../types/network/models/roomBeTypes';
import { TextMessage } from '../../types/store/ChatsRegistryTypes';
import { dateToISODate } from '../../utils/dateUtils';
import {
	buildQueryString,
	fetchAPI,
	RequestType,
	sendFileFetchAPI,
	uploadFileFetchAPI
} from '../../utils/FetchUtils';
import { getLastUnreadMessage } from '../xmpp/utility/getLastUnreadMessage';
import HistoryAccumulator from '../xmpp/utility/HistoryAccumulator';
import { xmppClient } from '../xmpp/XMPPClient';

export const listRooms = (members = false, settings = false): Promise<RoomBe[]> => {
	let paramsStr = '';
	if (members || settings) {
		const array = [];
		if (members) array.push('extraFields=members');
		if (settings) array.push('extraFields=settings');
		paramsStr = `?${array.join('&')}`;
	}
	return fetchAPI<RoomBe[]>(`rooms${paramsStr}`, RequestType.GET).then((resp) => {
		useStore.getState().addRooms(resp, true);
		return resp;
	});
};

export const addRoom = async (room: RoomCreationFields): Promise<RoomBe> =>
	fetchAPI<RoomBe>('rooms', RequestType.POST, room).then(async (response) => {
		const meetingType =
			room.type === RoomType.TEMPORARY ? MeetingType.SCHEDULED : MeetingType.PERMANENT;
		await createMeeting(response.id, meetingType, response.name ?? '');
		return response;
	});

export const getRoom = (roomId: string): Promise<RoomBe> =>
	fetchAPI(`rooms/${roomId}`, RequestType.GET);

export const updateRoom = (roomId: string, editableFields: RoomEditableFields): Promise<RoomBe> =>
	fetchAPI(`rooms/${roomId}`, RequestType.PUT, editableFields);

export const deleteRoom = (roomId: string): Promise<Response> =>
	fetchAPI(`rooms/${roomId}`, RequestType.DELETE);

export const deleteRoomAndMeeting = (roomId: string): Promise<Response> => {
	const meetingId = useStore.getState().rooms[roomId]?.meetingId;
	if (meetingId) {
		return deleteMeeting(meetingId).finally(() => deleteRoom(roomId));
	}
	return deleteRoom(roomId);
};

export const getURLRoomPicture = (roomId: string): string =>
	`${window.document.location.origin}/services/chats/rooms/${roomId}/picture`;

export const getRoomPicture = (roomId: string): Promise<Blob> =>
	fetchAPI(`rooms/${roomId}/picture`, RequestType.GET);

export const updateRoomPicture = (roomId: string, file: File): Promise<Response> =>
	new Promise((resolve, reject) => {
		const sizeLimit = useStore.getState().session.attributes?.maxRoomPictureSize;
		if (sizeLimit && file.size > sizeLimit * 1024 * 1024) {
			reject(new Error('File too large'));
		} else {
			uploadFileFetchAPI(`rooms/${roomId}/picture`, RequestType.PUT, file)
				.then((resp) => resolve(resp))
				.catch((error) => reject(new Error(error)));
		}
	});

export const deleteRoomPicture = (roomId: string): Promise<Response> =>
	fetchAPI(`rooms/${roomId}/picture`, RequestType.DELETE);

export const muteRoomNotification = (roomId: string): Promise<Response> =>
	fetchAPI(`rooms/${roomId}/mute`, RequestType.PUT);

export const unmuteRoomNotification = (roomId: string): Promise<Response> =>
	fetchAPI(`rooms/${roomId}/mute`, RequestType.DELETE);

export const clearRoomHistory = (roomId: string): Promise<{ clearedAt: string }> =>
	fetchAPI(`rooms/${roomId}/clear`, RequestType.PUT);

export const getRoomMembers = (roomId: string): Promise<MemberBe[]> =>
	fetchAPI(`rooms/${roomId}/members`, RequestType.GET);

export const addRoomMembers = (roomId: string, member: AddMemberFields[]): Promise<MemberBe[]> =>
	fetchAPI(`rooms/${roomId}/members`, RequestType.POST, member);

export const deleteRoomMember = (roomId: string, userId: string): Promise<Response> =>
	fetchAPI(`rooms/${roomId}/members/${userId}`, RequestType.DELETE);

export const promoteRoomMember = (roomId: string, userId: string): Promise<Response> =>
	fetchAPI(`rooms/${roomId}/members/${userId}/owner`, RequestType.PUT);

export const demotesRoomMember = (roomId: string, userId: string): Promise<Response> =>
	fetchAPI(`rooms/${roomId}/members/${userId}/owner`, RequestType.DELETE);

export const updateRoomOwners = (roomId: string, userIds: string[]): Promise<Response> =>
	fetchAPI(`rooms/${roomId}/members/owners`, RequestType.PUT, { Members: userIds });

export const getRoomAttachments = (
	roomId: string,
	params: GetRoomAttachmentsParams
): Promise<GetRoomAttachmentsResponse> =>
	fetchAPI(`rooms/${roomId}/attachments${buildQueryString({ ...params })}`, RequestType.GET);

export const bulkDeleteRoomAttachments = (
	roomId: string,
	attachmentIds: Array<string>
): Promise<BulkDeleteRoomAttachmentsResponse> =>
	fetchAPI(`rooms/${roomId}/attachments`, RequestType.DELETE, { attachmentIds });

export const replacePlaceholderRoom = (
	userId: string,
	text: string,
	file?: File
): Promise<RoomBe> => {
	const { setPlaceholderMessage, removePlaceholderRoom } = useStore.getState();
	setPlaceholderMessage({
		roomId: `placeholder-${userId}`,
		id: uuidGenerator(),
		text,
		attachment: file
			? { id: 'placeholderFileId', name: file.name, mimeType: file.type, size: file.size }
			: undefined
	});

	return addRoom({
		type: RoomType.ONE_TO_ONE,
		members: [{ userId, owner: true }]
	}).then((response) => {
		removePlaceholderRoom(userId);
		sendCustomEvent({
			name: EventName.ROUTE_REDIRECT,
			data: { path: `/${CHATS_ROUTE}/${response.id}` }
		});
		return response;
	});
};

export const addRoomAttachment = (
	roomId: string,
	file: File,
	optionalFields: {
		description?: string;
		replyId?: string;
		area?: string;
	},
	signal?: AbortSignal
): Promise<{ id: string }> => {
	const placeholderRoom = roomId.split('placeholder-');
	if (placeholderRoom[1]) {
		return replacePlaceholderRoom(placeholderRoom[1], optionalFields.description ?? '', file).then(
			(response) => {
				addRoomAttachment(response.id, file, optionalFields, signal);
				return response;
			}
		);
	}

	const lastMessageId = getLastUnreadMessage(roomId);
	if (lastMessageId) xmppClient.readMessage(roomId, lastMessageId);

	const uuid = uuidGenerator();
	useStore.getState().setPlaceholderMessage({
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

	return new Promise<{ id: string }>((resolve, reject) => {
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
					.then((resp: { id: string }) => {
						window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
						resolve(resp);
					})
					.catch((error) => {
						removePlaceholderMessage(roomId, uuid);
						reject(new Error(error));
					});
			} else {
				uploadFileFetchAPI(`rooms/${roomId}/attachments`, RequestType.POST, file, signal, optional)
					.then((resp: { id: string }) => {
						window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
						resolve(resp);
					})
					.catch((error) => {
						removePlaceholderMessage(roomId, uuid);
						reject(new Error(error));
					});
			}
		}
	});
};

export const forwardMessages = (
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
