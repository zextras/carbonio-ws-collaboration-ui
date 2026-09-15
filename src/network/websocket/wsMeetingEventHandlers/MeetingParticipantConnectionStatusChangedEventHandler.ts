/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingParticipantConnectionStatusChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMyId } from '../eventHandlersUtilities';

export const meetingParticipantConnectionStatusChangedEventHandler = (
	event: MeetingParticipantConnectionStatusChangedEvent
): void => {
	const state = useStore.getState();
	// First time we learn this participant's status — e.g. someone already in the meeting when we
	// joined, whose status we only receive now. We reciprocate below so the exchange is symmetric.
	const isFirstContact =
		state.activeMeeting?.meetingId === event.meetingId &&
		state.activeMeeting?.connectionQuality[event.userId] === undefined;

	state.setParticipantConnectionQuality(
		event.meetingId,
		event.userId,
		event.score,
		event.changedAt,
		event.maxTier
	);

	// Reciprocate on first contact (never to ourselves): when we join an ongoing meeting our initial
	// broadcast reaches the participants already there, and this makes each of them send us their
	// current status back (and vice versa) — independently of who finished setting up first. It
	// settles after one exchange, since the reply is no longer first-contact for the other side.
	if (isFirstContact && !isMyId(event.userId)) {
		state.activeMeeting?.qualityMonitor?.resyncTo(event.userId).catch(() => {});
	}
};
