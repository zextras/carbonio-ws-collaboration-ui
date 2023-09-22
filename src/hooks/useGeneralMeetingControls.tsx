/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, isEqual, size } from 'lodash';
import { useCallback, useEffect } from 'react';

import useRouting, { PAGE_INFO_TYPE } from './useRouting';
import { MeetingsApi } from '../network';
import { getMeetingByMeetingId, getTiles } from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';
import { STREAM_TYPE } from '../types/store/ActiveMeetingTypes';

const useGeneralMeetingControls = (meetingId: string): void => {
	const meeting = useStore((store) => getMeetingByMeetingId(store, meetingId));
	const tiles = useStore((store) => getTiles(store, meetingId));

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

	// Handle pinned tile disappearance
	useEffect(() => {
		const pinnedTile = useStore.getState().activeMeeting[meetingId]?.pinnedTile;
		const isDisappeared = !find(tiles, (tile) => isEqual(tile, pinnedTile));
		if (isDisappeared) {
			if (size(tiles) < 3 || pinnedTile?.type === STREAM_TYPE.VIDEO) {
				useStore.getState().setPinnedTile(meetingId, undefined);
			} else if (pinnedTile?.type === STREAM_TYPE.SCREEN) {
				// TODO manage stack of pinned tiles
				useStore.getState().setPinnedTile(meetingId, undefined);
			}
		}
	}, [tiles, meetingId]);
};

export default useGeneralMeetingControls;
