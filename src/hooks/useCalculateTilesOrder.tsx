/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { TileData } from '../meetings/components/TestTile';
import { getTiles } from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';

const useCalculateTilesOrder = (
	meetingId: string
): { centralTile: TileData; carouselTiles: TileData[] } => {
	const tilesData: TileData[] = useStore((store) => getTiles(store, meetingId));

	// TODO use this customHook to change the order of the tiles (pin and isTalking)

	const centralTile = useMemo(() => tilesData[0], [tilesData]);
	const carouselTiles = useMemo(() => tilesData.slice(1), [tilesData]);

	return { centralTile, carouselTiles };
};

export default useCalculateTilesOrder;
