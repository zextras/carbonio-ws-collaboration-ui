/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { concat, find, forEach, indexOf, last, map, min, range, without } from 'lodash';

import audioOff from '../meetings/assets/AudioOFF.mp3';
import audioOn from '../meetings/assets/AudioON.mp3';
import meetingIn from '../meetings/assets/MeetingIN.mp3';
import meetingOut from '../meetings/assets/MeetingOUT.mp3';
import screenshareOn from '../meetings/assets/ScreenShareON.mp3';
import waitingUserSound from '../meetings/assets/waitingUserOnQueue.mp3';
import { STREAM_TYPE, TileData } from '../types/store/ActiveMeetingTypes';

export enum MeetingSoundFeedback {
	MEETING_JOIN_NOTIFICATION = 'meetingJoinNotification',
	MEETING_LEAVE_NOTIFICATION = 'meetingLeaveNotification',
	MEETING_SCREENSHARE_NOTIFICATION = 'meetingScreenshareNotification',
	MEETING_AUDIO_ON = 'meetingAudioOn',
	MEETING_AUDIO_OFF = 'meetingAudioOff',
	NEW_WAITING_USER = 'newWaitingUser'
}

export const sendAudioFeedback = (type: MeetingSoundFeedback): Promise<void> | undefined => {
	switch (type) {
		case MeetingSoundFeedback.MEETING_JOIN_NOTIFICATION: {
			return new Audio(meetingIn).play();
		}
		case MeetingSoundFeedback.MEETING_LEAVE_NOTIFICATION: {
			return new Audio(meetingOut).play();
		}
		case MeetingSoundFeedback.MEETING_AUDIO_ON: {
			return new Audio(audioOn).play();
		}
		case MeetingSoundFeedback.MEETING_AUDIO_OFF: {
			return new Audio(audioOff).play();
		}
		case MeetingSoundFeedback.MEETING_SCREENSHARE_NOTIFICATION: {
			return new Audio(screenshareOn).play();
		}
		case MeetingSoundFeedback.NEW_WAITING_USER: {
			return new Audio(waitingUserSound).play();
		}
		default:
			return undefined;
	}
};

export const maximiseRowsAndColumns = (dimensions: Dimensions, tileWidth: number): Grid => {
	// 1rem (16px) of gap between tiles
	const tileHeight = tileWidth * (9 / 16);
	const rows = Math.floor(dimensions.height / (tileHeight + 16));
	const columns = Math.floor(dimensions.width / (tileWidth + 16));
	return { rows, columns };
};

export const findAllPossiblePairs = (tiles: number): Grid[] => {
	const rowIndices = range(2, tiles + 1);
	const pairs = [{ rows: 1, columns: tiles }];
	forEach(rowIndices, (rows) => {
		const columnIndices = range(1, last(pairs)?.columns);
		forEach(columnIndices, (columns): boolean => {
			if (rows * columns >= tiles) {
				pairs.push({ rows, columns });
				return false;
			}
			return true;
		});
	});
	return pairs;
};

export const calcGrid = (
	dimensions: Dimensions,
	rows: number,
	columns: number
): { area: number; tileWidth: number } => {
	const tilesRatio = (16 * columns) / (9 * rows);
	const containerRatio = dimensions.width / dimensions.height;

	let tileWidth = 0;
	let tileHeight = 0;
	if (tilesRatio > containerRatio) {
		// Tiles are more wide than tall respect to the container
		tileWidth = (dimensions.width - (16 * columns - 16)) / columns; // 16px of gap between tiles
		tileHeight = tileWidth * (9 / 16);
	} else {
		// Tiles are more tall than wide respect to the container
		tileHeight = (dimensions.height - (16 * rows - 16)) / rows; // 16px of gap between tiles
		tileWidth = tileHeight * (16 / 9);
	}
	return {
		area: tileWidth * tileHeight,
		tileWidth
	};
};

export const maximiseTileSize = (
	dimensions: Dimensions,
	numbersOfTiles: number
): { tileWidth: number; rows: number; columns: number } => {
	const containerArea = dimensions.width * dimensions.height;

	const pairs = findAllPossiblePairs(numbersOfTiles);
	const grid = map(pairs, (pair) => calcGrid(dimensions, pair.rows, pair.columns));
	const voids = map(grid, (tiles) =>
		containerArea - tiles.area > 0 ? containerArea - tiles.area : Infinity
	);

	const minVoid = min(voids);
	const minVoidAxes = pairs[indexOf(voids, minVoid)];
	const minVoidGrid = grid[indexOf(voids, minVoid)];

	return { tileWidth: minVoidGrid.tileWidth, rows: minVoidAxes.rows, columns: minVoidAxes.columns };
};

type Dimensions = {
	width: number;
	height: number;
};

export const orderSpeakingTiles = (
	meetingTiles: TileData[],
	speakingId: string,
	pinnedTile: boolean
): TileData[] => {
	const elementToBeMoved = find(
		meetingTiles,
		(tile) => tile.userId === speakingId && tile.type !== STREAM_TYPE.SCREEN
	);
	if (elementToBeMoved != null) {
		const arrayWithoutElement = without(meetingTiles, elementToBeMoved);
		if (!pinnedTile) {
			// if there's no pinned tile the speaking tile has to be the first on the list
			return concat(elementToBeMoved, arrayWithoutElement);
		}
		// if there's a pinned tile put the speaker on the second position
		arrayWithoutElement.splice(1, 0, elementToBeMoved);
		return arrayWithoutElement;
	}
	return meetingTiles;
};

type Grid = {
	rows: number;
	columns: number;
};

export const freeMediaResources = (streamTrack: MediaStream | null): void => {
	if (streamTrack != null) {
		const tracks = streamTrack.getTracks();
		tracks.forEach((track) => track.stop());
	}
};
