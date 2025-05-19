/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { forEach, sortBy } from 'lodash';

import { getMeetingParticipants } from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';
import { STREAM_TYPE, TileData } from '../types/store/ActiveMeetingTypes';
import { dateToTimestamp } from '../utils/dateUtils';

const useTiles = (meetingId: string): TileData[] => {
	const meetingParticipants = useStore((store) => getMeetingParticipants(store, meetingId));

	return useMemo(() => {
		const tiles: TileData[] = [];
		if (meetingParticipants) {
			const sortedParticipants = sortBy(
				meetingParticipants,
				(participant) => dateToTimestamp(participant.joinedAt),
				['asc']
			);
			forEach(sortedParticipants, (participant) => {
				tiles.push({
					userId: participant.userId,
					type: STREAM_TYPE.VIDEO,
					creationDate: participant.joinedAt
				});
				if (participant.screenStreamOn) {
					tiles.push({
						userId: participant.userId,
						type: STREAM_TYPE.SCREEN,
						creationDate: participant.dateScreenOn
					});
				}
			});
			return tiles;
		}
		return [];
	}, [meetingParticipants]);
};

export default useTiles;
