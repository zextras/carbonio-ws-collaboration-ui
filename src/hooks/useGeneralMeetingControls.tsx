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
import usePiPWindow from './usePipWindow';
import useRouting from './useRouting';
import { PAGE_INFO_TYPE } from '../meetings/contexts/routerContext';
import { getMeetingByMeetingId, leaveMeeting } from '../network';
import useTiles from './useTiles';
import {
	getMeetingActiveByMeetingId,
	getMeetingParticipants
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
		getMeetingParticipants(store, meetingId)
	);
	const setPinnedTile = useStore((store) => store.setPinnedTile);
	const meetingDisconnection = useStore((store) => store.meetingDisconnection);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const { closePipWindow } = usePiPWindow();
	const tiles = useTiles(meetingId);

	const { goToInfoPage, goToMeetingPage } = useRouting();

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const isDeclined = useRef(false);

	// Redirect to info page if meeting ended or some error occurred
	useEffect(() => {
		if (!isMeetingActive && !isDeclined.current) {
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
	const leaveMeetingAction = useCallback(() => leaveMeeting(meetingId), [meetingId]);

	useEffect(() => {
		window.parent.addEventListener('beforeunload', leaveMeetingAction);
		return (): void => {
			window.parent.removeEventListener('beforeunload', leaveMeetingAction);
		};
	}, [leaveMeetingAction]);

	// Handle pinned tile disappearance
	useEffect(() => {
		const pinnedTile = useStore.getState().activeMeeting?.pinnedTile;
		const isDisappeared = !find(
			tiles,
			(tile) => tile.userId === pinnedTile?.userId && tile.type === pinnedTile?.type
		);
		if (pinnedTile) {
			// Remove pin in face to face mode || Remove pin video if participant left
			if (size(tiles) < 3 || (isDisappeared && pinnedTile?.type === STREAM_TYPE.VIDEO)) {
				setPinnedTile(undefined);
			} else if (isDisappeared && pinnedTile?.type === STREAM_TYPE.SCREEN) {
				// Remove pin screen if participant left or stopped sharing replacing with another screen
				const allScreenShare = filter(tiles, (tile) => tile.type === STREAM_TYPE.SCREEN);
				const screenToPin = maxBy(allScreenShare, (tile) => tile.creationDate);
				setPinnedTile(screenToPin);
			}
		}
	}, [tiles, setPinnedTile]);

	// Pin screen share tile if I join a meeting with it (to do only once after join)
	useEffect(() => {
		const screenShareParticipant = find(
			meetingParticipants,
			(user) => user.screenStreamOn === true
		);
		if (screenShareParticipant) {
			setPinnedTile({
				userId: screenShareParticipant.userId,
				type: STREAM_TYPE.SCREEN
			});
		}
		// eslint-disable-next-line
	}, [setPinnedTile]);

	// Disconnect user if he joins the meeting with other session
	const meetingParticipantClashedHandler = useCallback(
		(event: CustomEvent<MeetingWaitingParticipantClashedEvent['data']> | undefined) => {
			meetingDisconnection(event?.detail.meetingId ?? '');
			closePipWindow();
			goToInfoPage(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
		},
		[closePipWindow, goToInfoPage, meetingDisconnection]
	);
	useEventListener(EventName.MEETING_PARTICIPANT_CLASHED, meetingParticipantClashedHandler);

	// Redirect to info page when callee declines the call
	const meetingDeclinedHandler = useCallback(() => {
		isDeclined.current = true;
		closePipWindow();
		goToInfoPage(PAGE_INFO_TYPE.MEETING_DECLINED, meetingId);
	}, [closePipWindow, goToInfoPage, meetingId]);
	useEventListener(EventName.MEETING_DECLINED, meetingDeclinedHandler);

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

	// Show a snackbar when WebSocket reconnects and automatically leave the meeting if the user is no longer present
	const websocketNetworkStatusPrev = useRef(websocketNetworkStatus);
	useEffect(() => {
		if (websocketNetworkStatusPrev.current === false && websocketNetworkStatus === true) {
			getMeetingByMeetingId(meetingId).then((meeting) => {
				const userInMeeting = find(
					meeting?.participants,
					(member) => member.userId === useStore.getState().session.id
				);
				if (userInMeeting) {
					createSnackbar({
						key: new Date().toLocaleString(),
						severity: 'info',
						label: connectionReestablishedLabel,
						hideButton: true
					});
				} else {
					meetingDisconnection(meetingId);
					goToInfoPage(PAGE_INFO_TYPE.GENERAL_ERROR);
				}
			});
		}
		websocketNetworkStatusPrev.current = websocketNetworkStatus;
	}, [
		connectionReestablishedLabel,
		createSnackbar,
		goToInfoPage,
		goToMeetingPage,
		meetingDisconnection,
		meetingId,
		websocketNetworkStatus
	]);
};

export default useGeneralMeetingControls;
