/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { MediaStatus } from './externalAccess/MeetingExternalAccessPage';
import { MEETINGS_PATH } from '../../../constants/appConstants';
import useDarkReader from '../../../hooks/useDarkReader';
import useEventListener, { EventName } from '../../../hooks/useEventListener';
import useRouting from '../../../hooks/useRouting';
import { enterMeeting, joinMeeting, leaveWaitingRoom } from '../../../network';
import { getRoomIdByMeetingId } from '../../../store/selectors/MeetingSelectors';
import { getIsLoggedUserExternal } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { BrowserUtils } from '../../../utils/BrowserUtils';
import { PAGE_INFO_TYPE } from '../../contexts/routerContext';

const useAccessMeeting = (
	mediaStatus: MediaStatus,
	hasUserDirectAccess = false
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
	userIsReady: boolean;
} => {
	const meetingId = useMemo(() => window.location.pathname.split(MEETINGS_PATH)[1], []);

	const [userIsReady, setUserIsReady] = useState<boolean>(false);

	const isLoggedUserExternal = useStore(getIsLoggedUserExternal);

	const { goToInfoPage, goToMeetingPage } = useRouting();

	const { enableDarkReader } = useDarkReader();

	const handleEnterMeeting = useCallback(() => {
		const roomId = getRoomIdByMeetingId(useStore.getState(), meetingId) ?? '';
		enterMeeting(
			roomId,
			{
				videoStreamEnabled: mediaStatus.video.enabled,
				audioStreamEnabled: mediaStatus.audio.enabled
			},
			{
				audioDevice: mediaStatus.audio.selectedDeviceId,
				videoDevice: mediaStatus.video.selectedDeviceId
			}
		)
			.then((meetingId) => {
				enableDarkReader();
				goToMeetingPage(meetingId);
			})
			.catch((err) => console.error(err, 'Error on joinMeeting'));
	}, [meetingId, mediaStatus, enableDarkReader, goToMeetingPage]);

	const handleWaitingRoom = useCallback(() => {
		joinMeeting(
			meetingId,
			{
				videoStreamEnabled: mediaStatus.video.enabled,
				audioStreamEnabled: mediaStatus.audio.enabled
			},
			{
				audioDevice: mediaStatus.audio.selectedDeviceId,
				videoDevice: mediaStatus.video.selectedDeviceId
			}
		)
			.then((resp) => {
				if (resp.status === 'WAITING') setUserIsReady(true);
				if (resp.status === 'ACCEPTED') {
					enableDarkReader();
					goToMeetingPage(meetingId);
				}
			})
			.catch((err) => console.error(err, 'Error on waitingRoomHandler'));
	}, [meetingId, mediaStatus, enableDarkReader, goToMeetingPage]);

	// User is accepted from waiting room
	useEventListener(EventName.MEETING_WAITING_PARTICIPANT_ACCEPTED, handleWaitingRoom);

	// User is rejected from waiting room
	useEventListener(EventName.MEETING_WAITING_PARTICIPANT_REJECTED, () => {
		goToInfoPage(PAGE_INFO_TYPE.NEXT_TIME_PAGE);
	});

	// User opens meeting in another tab
	useEventListener(EventName.MEETING_WAITING_PARTICIPANT_CLASHED, () => {
		goToInfoPage(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
	});

	// Meeting ended while in waiting room
	useEventListener(EventName.MEETING_STOPPED, () => {
		if (!hasUserDirectAccess) {
			goToInfoPage(PAGE_INFO_TYPE.INVALID_WAITING_ROOM);
		}
	});

	const handleLeave = useCallback(() => {
		if (userIsReady) {
			leaveWaitingRoom(meetingId);
		}
		if (isLoggedUserExternal) {
			BrowserUtils.clearAuthCookies();
		}
		goToInfoPage(PAGE_INFO_TYPE.HANG_UP_PAGE);
	}, [goToInfoPage, isLoggedUserExternal, meetingId, userIsReady]);

	// Leave waiting list on window close
	useEffect(() => {
		window.parent.addEventListener('beforeunload', handleLeave);
		return (): void => {
			window.parent.removeEventListener('beforeunload', handleLeave);
		};
	}, [handleLeave]);

	return {
		handleLeave,
		handleEnterMeeting,
		handleWaitingRoom,
		userIsReady
	};
};
export default useAccessMeeting;
