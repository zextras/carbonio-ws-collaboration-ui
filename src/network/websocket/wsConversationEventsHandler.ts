/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { WireRoomMemberAddedEvent } from '@zextras/carbonio-ws-collaboration-sdk';

import { notifyConfigRow } from './configRowEffects';
import { refreshPresence } from './presenceRefresh';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import { getMeetingIdFromRoom } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import type {
	RoomMemberAddedEvent,
	RoomMemberRemovedEvent
} from '../../types/network/websocket/wsConversationEvents';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { RoomType } from '../../types/store/RoomTypes';
import { chatClient, isWscPure } from '../chatClient/ChatClient';
import { getMeeting, getRoom } from '../index';
import { wscSdk } from '../sdk/wscSdk';

/**
 * WSC 2.0.0 lands the member lines from the push events, which carry the
 * line's author (`addedBy`); v1 lands them from XMPP.
 */
function landMemberAddedLine(event: RoomMemberAddedEvent): void {
	if (!isWscPure()) {
		return;
	}
	const row = wscSdk.handleRoomMemberAdded(event as WireRoomMemberAddedEvent);
	if (row) {
		notifyConfigRow(row);
	}
}

function landMemberRemovedLine(event: RoomMemberRemovedEvent): void {
	if (!isWscPure()) {
		return;
	}
	const row = wscSdk.handleRoomMemberRemoved(event);
	if (row) {
		notifyConfigRow(row);
	}
}

/** WSC 2.0.0 reloads the presence of new members over REST; v1 receives it from XMPP. */
function refreshMembersPresence(userIds: Array<string>): void {
	if (!isWscPure()) {
		return;
	}
	refreshPresence(userIds);
}

function onRoomMemberAdded(event: RoomMemberAddedEvent): void {
	const state = useStore.getState();
	landMemberAddedLine(event);
	if (event.userId === state.session.id) {
		getRoom(event.roomId).then((response) => {
			state.addRooms([response]);
			refreshMembersPresence((response.members ?? []).map((member) => member.userId));
			if (response.meetingId) {
				getMeeting(response.id).then((meetingResponse) => state.addMeetings([meetingResponse]));
			}
		});
	} else {
		state.addRoomMember(event.roomId, {
			userId: event.userId,
			owner: event.isOwner
		});
		refreshMembersPresence([event.userId]);
	}
}

export const wsConversationEventsHandler = (event: WsEvent): void => {
	const state = useStore.getState();
	const isMyId = (userId: string): boolean => userId === state.session.id;

	switch (event.type) {
		case WsEventType.ROOM_CREATED: {
			getRoom(event.roomId).then((response) => {
				state.addRooms([response]);
				refreshMembersPresence((response.members ?? []).map((member) => member.userId));
			});
			chatClient.setOnline();
			break;
		}
		case WsEventType.ROOM_UPDATED: {
			state.editRoom(event.roomId, { name: event.name, description: event.description });
			break;
		}
		case WsEventType.ROOM_DELETED: {
			state.removeRoom(event.roomId);
			break;
		}
		case WsEventType.ROOM_OWNER_PROMOTED: {
			state.setMemberModeratorStatus(event.roomId, event.userId, true);
			if (isMyId(event.userId)) {
				sendCustomEvent({
					name: EventName.MEMBER_PROMOTED,
					data: event
				});
			}
			break;
		}
		case WsEventType.ROOM_OWNER_DEMOTED: {
			state.setMemberModeratorStatus(event.roomId, event.userId, false);
			if (isMyId(event.userId)) {
				sendCustomEvent({
					name: EventName.MEMBER_DEMOTED,
					data: event
				});
			}
			break;
		}
		case WsEventType.ROOM_PICTURE_CHANGED: {
			state.editRoom(event.roomId, { pictureUpdatedAt: event.updatedAt });
			break;
		}
		case WsEventType.ROOM_PICTURE_DELETED: {
			state.editRoom(event.roomId, { pictureUpdatedAt: undefined });
			break;
		}
		case WsEventType.ROOM_MEMBER_ADDED: {
			onRoomMemberAdded(event);
			break;
		}
		case WsEventType.ROOM_MEMBER_REMOVED: {
			landMemberRemovedLine(event);
			if (isMyId(event.userId)) {
				const meetingId = getMeetingIdFromRoom(useStore.getState(), event.roomId);
				if (meetingId) {
					state.deleteMeeting(meetingId);
				}
				state.removeRoom(event.roomId);
			} else {
				state.removeRoomMember(event.roomId, event.userId);
			}
			break;
		}
		case WsEventType.ROOM_MUTED: {
			state.setRoomMuteStatus(event.roomId, true);
			break;
		}
		case WsEventType.ROOM_UNMUTED: {
			state.setRoomMuteStatus(event.roomId, false);
			break;
		}
		case WsEventType.ROOM_HISTORY_CLEARED: {
			state.clearConversation(event.roomId, event.clearedAt);
			if (state.rooms[event.roomId]?.type === RoomType.TEMPORARY) {
				state.removePinnedMessage(event.roomId);
			}
			break;
		}
		default: {
			console.error(`Unhandled conversation event type: ${event.type}`);
		}
	}
};
