/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect } from 'react';

import { filter, find, maxBy, size } from 'lodash';

import useEventListener, { EventName } from './useEventListener';
import useRouting, { PAGE_INFO_TYPE } from './useRouting';
import { MeetingsApi } from '../network';
import {
	getMeetingActiveByMeetingId,
	getMeetingParticipantsByMeetingId,
	getTiles
} from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';
import { STREAM_TYPE } from '../types/store/ActiveMeetingTypes';
import { MeetingParticipantMap } from '../types/store/MeetingTypes';

const useGeneralMeetingControls = (meetingId: string): void => {
	const isMeetingActive = useStore((store) => getMeetingActiveByMeetingId(store, meetingId));
	const meetingParticipants: MeetingParticipantMap | undefined = useStore((store) =>
		getMeetingParticipantsByMeetingId(store, meetingId)
	);

	const tiles = useStore((store) => getTiles(store, meetingId));
	const setPinnedTile = useStore((store) => store.setPinnedTile);
	const meetingDisconnection = useStore((store) => store.meetingDisconnection);

	const { goToInfoPage } = useRouting();

	const leaveMeeting = useCallback(() => MeetingsApi.leaveMeeting(meetingId), [meetingId]);

	// Redirect to info page if meeting ended or some error occurred
	useEffect(() => {
		if (!isMeetingActive) {
			meetingDisconnection(meetingId);
			goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
		}
		return () => {
			if (window.parent.document.fullscreenElement) {
				window.parent.document.exitFullscreen();
			}
		};
	}, [goToInfoPage, isMeetingActive, meetingDisconnection, meetingId]);

	// Leave meeting on window close
	useEffect(() => {
		window.parent.addEventListener('beforeunload', leaveMeeting);
		return () => {
			window.parent.removeEventListener('beforeunload', leaveMeeting);
		};
	}, [leaveMeeting]);

	// Handle pinned tile disappearance
	useEffect(() => {
		const pinnedTile = useStore.getState().activeMeeting[meetingId]?.pinnedTile;
		const isDisappeared = !find(
			tiles,
			(tile) => tile.userId === pinnedTile?.userId && tile.type === pinnedTile?.type
		);
		if (pinnedTile) {
			const { setPinnedTile } = useStore.getState();
			// Remove pin in face to face mode || Remove pin video if participant left
			if (size(tiles) < 3 || (isDisappeared && pinnedTile?.type === STREAM_TYPE.VIDEO)) {
				setPinnedTile(meetingId, undefined);
			} else if (isDisappeared && pinnedTile?.type === STREAM_TYPE.SCREEN) {
				// Remove pin screen if participant left or stopped sharing replacing with another screen
				const allScreenShare = filter(tiles, (tile) => tile.type === STREAM_TYPE.SCREEN);
				const screenToPin = maxBy(allScreenShare, (tile) => tile.creationDate);
				setPinnedTile(meetingId, screenToPin);
			}
		}
	}, [tiles, meetingId]);

	// Pin screen share tile if I join a meeting with it (to do only once after join)
	useEffect(() => {
		const screenShareParticipant = find(
			meetingParticipants,
			(user) => user.screenStreamOn === true
		);
		if (screenShareParticipant) {
			setPinnedTile(meetingId, {
				userId: screenShareParticipant.userId,
				type: STREAM_TYPE.SCREEN
			});
		}
		// eslint-disable-next-line
	}, [meetingId, setPinnedTile]);

	const meetingParticipantClashedHandler = useCallback(
		(event) => {
			meetingDisconnection(event.detail.meetingId);
			goToInfoPage(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
		},
		[goToInfoPage, meetingDisconnection]
	);

	useEventListener(EventName.MEETING_PARTICIPANT_CLASHED, meetingParticipantClashedHandler);
};

export default useGeneralMeetingControls;
