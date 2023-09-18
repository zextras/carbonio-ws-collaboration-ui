/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { findIndex } from 'lodash';
import { useMemo } from 'react';

import { getPinnedTile } from '../store/selectors/ActiveMeetingSelectors';
import { getTiles } from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';
import { TileData } from '../types/store/ActiveMeetingTypes';

const useCalculateTilesOrder = (
	meetingId: string
): { centralTile: TileData; carouselTiles: TileData[] } => {
	const tilesData: TileData[] = useStore((store) => getTiles(store, meetingId));
	const pinnedTile: TileData | undefined = useStore((store) => getPinnedTile(store, meetingId));

	const orderedTiles = useMemo(() => {
		if (pinnedTile) {
			const pinnedTileIndex = findIndex(
				tilesData,
				(tile) => tile.userId === pinnedTile.userId && tile.type === pinnedTile.type
			);
			if (pinnedTileIndex !== -1) {
				return [
					tilesData[pinnedTileIndex],
					...tilesData.slice(0, pinnedTileIndex),
					...tilesData.slice(pinnedTileIndex + 1)
				];
			}
		}
		return tilesData;
	}, [tilesData, pinnedTile]);

	const centralTile = useMemo(() => orderedTiles[0], [orderedTiles]);
	const carouselTiles = useMemo(() => orderedTiles.slice(1), [orderedTiles]);

	return { centralTile, carouselTiles };
};

export default useCalculateTilesOrder;
