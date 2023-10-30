/* eslint-disable prefer-destructuring */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { differenceWith, findIndex, first, intersectionWith, isEqual, size } from 'lodash';

import { getPinnedTile, getTalkingList } from '../store/selectors/ActiveMeetingSelectors';
import { getTiles } from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';
import { STREAM_TYPE, TileData } from '../types/store/ActiveMeetingTypes';
import { orderSpeakingTiles } from '../utils/MeetingsUtils';

const useTilesOrder = (meetingId: string): { centralTile: TileData; carouselTiles: TileData[] } => {
	const tilesData: TileData[] = useStore((store) => getTiles(store, meetingId));
	const pinnedTile: TileData | undefined = useStore((store) => getPinnedTile(store, meetingId));
	const isTalkingList = useStore((store) => getTalkingList(store, meetingId));

	const [tiles, setTiles] = useState<TileData[]>(tilesData);

	// Swap new pinned tile with the first tile
	useEffect(() => {
		if (pinnedTile) {
			setTiles((tiles) => {
				const tileToMoveIndex = findIndex(
					tiles,
					(tile) => tile.userId === pinnedTile.userId && tile.type === pinnedTile.type
				);
				if (tileToMoveIndex !== -1) {
					const newTiles = [...tiles];
					const tileToMove = newTiles[tileToMoveIndex];
					newTiles[tileToMoveIndex] = newTiles[0];
					newTiles[0] = tileToMove;
					return newTiles;
				}
				return tiles;
			});
		}
	}, [pinnedTile]);

	// Add/remove tiles when tilesData changes
	useEffect(() => {
		if (size(tilesData) > size(tiles)) {
			setTiles((tiles) => {
				const newTiles = differenceWith(tilesData, tiles, isEqual);
				return [...tiles, ...newTiles];
			});
		}
		if (size(tilesData) < size(tiles)) {
			setTiles((tiles) => intersectionWith(tiles, tilesData, isEqual));
		}
	}, [tilesData, tiles]);

	// swap handlers
	const checkIfIsStillTalking = useCallback(
		(prevFirstIsTalking) => {
			if (first(isTalkingList) === prevFirstIsTalking) {
				setTiles((tiles) => orderSpeakingTiles(tiles, prevFirstIsTalking, !!pinnedTile));
			}
		},
		[isTalkingList, pinnedTile]
	);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (
				size(isTalkingList) > 0 &&
				(!pinnedTile ||
					pinnedTile.userId !== isTalkingList[0] ||
					pinnedTile.type === STREAM_TYPE.SCREEN)
			) {
				checkIfIsStillTalking(isTalkingList[0]);
			}
		}, 2000);
		return () => clearTimeout(timer);
	}, [checkIfIsStillTalking, isTalkingList, pinnedTile, pinnedTile?.type, pinnedTile?.userId]);

	const centralTile = useMemo(() => tiles[0], [tiles]);
	const carouselTiles = useMemo(() => tiles.slice(1), [tiles]);

	return { centralTile, carouselTiles };
};

export default useTilesOrder;
