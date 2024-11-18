/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo } from 'react';

import { MEETINGS_PATH } from '../../../constants/appConstants';
import useDarkReader from '../../../hooks/useDarkReader';
import useEventListener, { EventName } from '../../../hooks/useEventListener';
import useRouting, { PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { getRoomIdFromMeeting } from '../../../store/selectors/MeetingSelectors';
import { getIsLoggedUserExternal } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { BrowserUtils } from '../../../utils/BrowserUtils';
import { freeMediaResources } from '../../../utils/MeetingsUtils';

const useAccessMeetingAction = (
	hasUserDirectAccess: boolean,
	streamTrack: MediaStream | null,
	userIsReady: boolean,
	setUserIsReady: Dispatch<SetStateAction<boolean>>
): {
	handleLeave: () => void;
	handleEnterMeeting: (
		mediaDevicesEnabled?: { audio: boolean; video: boolean },
		selectedDevicesId?: { audio?: string; video?: string }
	) => void;
	handleWaitingRoom: (
		mediaDevicesEnabled?: { audio: boolean; video: boolean },
		selectedDevicesId?: { audio?: string; video?: string }
	) => void;
} => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const isLoggedUserExternal = useStore(getIsLoggedUserExternal);

	const { goToInfoPage, goToMeetingPage } = useRouting();

	const { darkReaderStatus, enableDarkReader, disableDarkReader } = useDarkReader();

	useEffect(() => {
		enableDarkReader();
	}, [darkReaderStatus, disableDarkReader, enableDarkReader]);

	const handleMeetingEnded = useCallback(() => {
		if (!hasUserDirectAccess) {
			goToInfoPage(PAGE_INFO_TYPE.INVALID_WAITING_ROOM);
		}
	}, [goToInfoPage, hasUserDirectAccess]);

	useEventListener(EventName.MEETING_STOPPED, handleMeetingEnded);

	const handleRejected = useCallback(() => {
		freeMediaResources(streamTrack);
		goToInfoPage(PAGE_INFO_TYPE.NEXT_TIME_PAGE);
	}, [goToInfoPage, streamTrack]);

	useEventListener(EventName.MEETING_USER_REJECTED, handleRejected);

	const handleRejoin = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
	}, [goToInfoPage]);

	useEventListener(EventName.MEETING_WAITING_PARTICIPANT_CLASHED, handleRejoin);

	const handleLeave = useCallback(() => {
		freeMediaResources(streamTrack);
		if (userIsReady) {
			MeetingsApi.leaveWaitingRoom(meetingId);
		} else if (isLoggedUserExternal) {
			BrowserUtils.clearAuthCookies();
		}
		goToInfoPage(PAGE_INFO_TYPE.HANG_UP_PAGE);
	}, [goToInfoPage, isLoggedUserExternal, meetingId, streamTrack, userIsReady]);

	// Leave waiting list on window close
	useEffect(() => {
		window.parent.addEventListener('beforeunload', handleLeave);
		return (): void => {
			window.parent.removeEventListener('beforeunload', handleLeave);
		};
	}, [handleLeave]);

	const handleEnterMeeting = useCallback(
		(
			mediaDevicesEnabled?: { audio: boolean; video: boolean },
			selectedDevicesId?: { audio?: string; video?: string }
		) => {
			MeetingsApi.enterMeeting(
				getRoomIdFromMeeting(useStore.getState(), meetingId) ?? '',
				{
					videoStreamEnabled: mediaDevicesEnabled ? mediaDevicesEnabled.video : false,
					audioStreamEnabled: mediaDevicesEnabled ? mediaDevicesEnabled.audio : false
				},
				{
					audioDevice: selectedDevicesId ? selectedDevicesId.audio : undefined,
					videoDevice: selectedDevicesId ? selectedDevicesId.video : undefined
				}
			)
				.then((meetingId) => {
					freeMediaResources(streamTrack);
					goToMeetingPage(meetingId);
				})
				.catch((err) => console.error(err, 'Error on joinMeeting'));
		},
		[meetingId, streamTrack, goToMeetingPage]
	);

	const handleWaitingRoom = useCallback(
		(
			mediaDevicesEnabled?: { audio: boolean; video: boolean },
			selectedDevicesId?: { audio?: string; video?: string }
		) => {
			MeetingsApi.joinMeeting(
				meetingId,
				{
					videoStreamEnabled: mediaDevicesEnabled ? mediaDevicesEnabled.video : false,
					audioStreamEnabled: mediaDevicesEnabled ? mediaDevicesEnabled.audio : false
				},
				{
					audioDevice: selectedDevicesId ? selectedDevicesId.audio : undefined,
					videoDevice: selectedDevicesId ? selectedDevicesId.video : undefined
				}
			)
				.then((resp) => {
					if (resp.status === 'WAITING') setUserIsReady(true);
					if (resp.status === 'ACCEPTED') {
						freeMediaResources(streamTrack);
						goToMeetingPage(meetingId);
					}
				})
				.catch((err) => console.error(err, 'Error on waitingRoomHandler'));
		},
		[goToMeetingPage, meetingId, setUserIsReady, streamTrack]
	);

	return {
		handleLeave,
		handleEnterMeeting,
		handleWaitingRoom
	};
};
export default useAccessMeetingAction;
