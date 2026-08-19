/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingParticipantConnectionQualityChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';

export const meetingParticipantConnectionQualityChangedEventHandler = (
	event: MeetingParticipantConnectionQualityChangedEvent
): void => {
	useStore
		.getState()
		.setParticipantConnectionQuality(event.meetingId, event.userId, event.quality, event.changedAt);
};
