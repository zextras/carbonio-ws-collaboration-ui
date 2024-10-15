/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useRef } from 'react';

import { CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { filter, find, maxBy, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import useEventListener, {
	EventName,
	MeetingWaitingParticipantClashedEvent
} from './useEventListener';
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
	const [t] = useTranslation();
	const mutedByModerator = t(
		'snackbar.mutedByModerator',
		"You've been muted by a moderator, unmute yourself to speak"
	);
	const okLabel = t('action.ok', 'Ok');
	const connectionReestablishedLabel = t(
		'feedback.connectionReestabilished',
		'Connection re-established, meeting can continue without interruption.'
	);

	const isMeetingActive = useStore((store) => getMeetingActiveByMeetingId(store, meetingId));
	const meetingParticipants: MeetingParticipantMap | undefined = useStore((store) =>
		getMeetingParticipantsByMeetingId(store, meetingId)
	);
	const tiles = useStore((store) => getTiles(store, meetingId));
	const setPinnedTile = useStore((store) => store.setPinnedTile);
	const meetingConnection = useStore((store) => store.meetingConnection);
	const meetingDisconnection = useStore((store) => store.meetingDisconnection);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const { goToInfoPage, goToMeetingPage } = useRouting();

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	// Redirect to info page if meeting ended or some error occurred
	useEffect(() => {
		if (!isMeetingActive) {
			meetingDisconnection(meetingId);
			goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
		}
		return (): void => {
			if (window.parent.document.fullscreenElement) {
				window.parent.document.exitFullscreen();
			}
		};
	}, [goToInfoPage, isMeetingActive, meetingDisconnection, meetingId]);

	// Leave meeting on window close
	const leaveMeeting = useCallback(() => MeetingsApi.leaveMeeting(meetingId), [meetingId]);

	useEffect(() => {
		window.parent.addEventListener('beforeunload', leaveMeeting);
		return (): void => {
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

	// Disconnect user if he joins the meeting with other session
	const meetingParticipantClashedHandler = useCallback(
		(event: CustomEvent<MeetingWaitingParticipantClashedEvent['data']> | undefined) => {
			meetingDisconnection(event?.detail.meetingId ?? '');
			goToInfoPage(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
		},
		[goToInfoPage, meetingDisconnection]
	);
	useEventListener(EventName.MEETING_PARTICIPANT_CLASHED, meetingParticipantClashedHandler);

	// Display snackbar when user is muted by moderator
	const handleMutedEvent = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			severity: 'info',
			label: mutedByModerator,
			actionLabel: okLabel,
			disableAutoHide: true
		});
	}, [createSnackbar, mutedByModerator, okLabel]);
	useEventListener(EventName.MEMBER_MUTED, handleMutedEvent);

	// Display snackbar when ws reconnect and leave meeting if user is no more in it
	const websocketNetworkStatusPrev = useRef(websocketNetworkStatus);
	useEffect(() => {
		if (websocketNetworkStatusPrev.current === false && websocketNetworkStatus === true) {
			MeetingsApi.getMeetingByMeetingId(meetingId).then((meeting) => {
				const userInMeeting = find(
					meeting?.participants,
					(member) => member.userId === useStore.getState().session.id
				);
				if (!userInMeeting) {
					meetingDisconnection(meetingId);
					goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
				}
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'info',
					label: connectionReestablishedLabel,
					hideButton: true
				});
			});
		}
		websocketNetworkStatusPrev.current = websocketNetworkStatus;
	}, [
		connectionReestablishedLabel,
		createSnackbar,
		goToInfoPage,
		goToMeetingPage,
		meetingConnection,
		meetingDisconnection,
		meetingId,
		websocketNetworkStatus
	]);
};

export default useGeneralMeetingControls;
