/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { getPinnedTile } from '../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';
import { STREAM_TYPE, TileData } from '../types/store/ActiveMeetingTypes';

type usePinnedTileReturn = {
	isPinned: boolean;
	switchPinnedTile: () => void;
	canUsePinFeature: boolean;
};
const usePinnedTile = (
	meetingId: string,
	userId: string,
	isScreenShare = false
): usePinnedTileReturn => {
	const pinnedTile: TileData | undefined = useStore((store) => getPinnedTile(store, meetingId));
	const setPinnedTile = useStore((store) => store.setPinnedTile);
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId));

	const isPinned = useMemo(
		() =>
			!!pinnedTile &&
			pinnedTile.userId === userId &&
			((pinnedTile.type === STREAM_TYPE.VIDEO && !isScreenShare) ||
				(pinnedTile.type === STREAM_TYPE.SCREEN && isScreenShare)),
		[pinnedTile, userId, isScreenShare]
	);

	const switchPinnedTile = useCallback(() => {
		const tileData = !isPinned
			? { userId, type: isScreenShare ? STREAM_TYPE.SCREEN : STREAM_TYPE.VIDEO }
			: undefined;
		setPinnedTile(meetingId, tileData);
	}, [isPinned, isScreenShare, meetingId, setPinnedTile, userId]);

	const canUsePinFeature = useMemo(() => numberOfTiles > 2, [numberOfTiles]);

	return { isPinned, switchPinnedTile, canUsePinFeature };
};

export default usePinnedTile;
