/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect } from 'react';

import useRouting, { PAGE_INFO_TYPE } from './useRouting';
import { MeetingsApi } from '../network';
import { getMeetingByMeetingId } from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';

const useGeneralMeetingControls = (meetingId: string): void => {
	const meeting = useStore((store) => getMeetingByMeetingId(store, meetingId));

	const { goToInfoPage } = useRouting();

	const leaveMeeting = useCallback(() => MeetingsApi.leaveMeeting(meetingId), [meetingId]);

	// Redirect if meeting ended or some error occurred
	useEffect(() => {
		if (!meeting) goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
	}, [goToInfoPage, meeting]);

	// Leave meeting on window close
	useEffect(() => {
		window.parent.addEventListener('beforeunload', leaveMeeting);
		return () => {
			window.parent.removeEventListener('beforeunload', leaveMeeting);
		};
	}, [leaveMeeting]);
};

export default useGeneralMeetingControls;
