/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName } from '../hooks/useEventListener';
import audioOff from '../meetings/assets/AudioOFF.mp3';
import audioOn from '../meetings/assets/AudioON.mp3';
import meetingIn from '../meetings/assets/MeetingIN.mp3';
import meetingOut from '../meetings/assets/MeetingOUT.mp3';
import screenshareOn from '../meetings/assets/ScreenShareON.mp3';

export const calcTilesQuantity = (wrapperHeight: number): number =>
	Math.floor(wrapperHeight / (144 + 8));

export const listOfTileToShow = (
	numOfTiles: number,
	streams: string[],
	lastTileIdxPosition: number | null
): string[] => {
	const idsListTileToShow = [];
	const lastPositionParsed = lastTileIdxPosition ?? 0;
	for (let i = 0; i < numOfTiles; i += 1) {
		switch (true) {
			case !streams[lastPositionParsed + i + 1]:
			case !streams[lastPositionParsed + i]:
			case lastTileIdxPosition === streams.length - 1: {
				idsListTileToShow.push(streams[lastPositionParsed + 1 + i - streams.length]);
				break;
			}
			case lastTileIdxPosition !== 0 && !lastTileIdxPosition: {
				idsListTileToShow.push(streams[i]);
				break;
			}
			case lastTileIdxPosition === 0: {
				idsListTileToShow.push(streams[lastPositionParsed + i]);
				break;
			}
			default: {
				idsListTileToShow.push(streams[lastPositionParsed + i + 1]);
			}
		}
	}
	return idsListTileToShow;
};

export const positionToStartOnPrevButton = (
	numOfTiles: number,
	streams: string[],
	lastTileIdxPosition: number | null
): number => {
	const lastPositionParsed = lastTileIdxPosition ?? 0;
	switch (Math.sign(lastPositionParsed - numOfTiles * 2)) {
		case 1:
		case 0: {
			return lastPositionParsed - numOfTiles * 2;
		}
		case -1: {
			if (numOfTiles * 2 > lastPositionParsed) {
				const arrSize = streams.length - 1;
				const diffLPTV = Math.abs(lastPositionParsed - numOfTiles * 2 + 1);
				if (Math.sign(arrSize - diffLPTV) === -1) {
					const tt = Math.abs(arrSize - diffLPTV);
					return arrSize - tt + 2;
				}
			}
			const arrSize = streams.length - 1;
			const diffLPTV = Math.abs(lastPositionParsed - numOfTiles * 2 + 1);
			return arrSize - diffLPTV;
		}
		default: {
			return 0;
		}
	}
};

export const positionToStartOnNextButton = (
	numOfTiles: number,
	streams: string[],
	lastTileIdxPosition: number | null
): number => {
	const lastPositionParsed = lastTileIdxPosition ?? 0;
	if (streams[lastPositionParsed + numOfTiles]) {
		return lastPositionParsed + numOfTiles;
	}
	const lastIdx = streams.length - 1;
	const idxStepToMove = lastIdx - lastPositionParsed;
	return numOfTiles - idxStepToMove - 1;
};

export const sendAudioFeedback = (type: EventName): Promise<void> | undefined => {
	switch (type) {
		case EventName.MEETING_JOIN_NOTIFICATION: {
			return new Audio(meetingIn).play();
		}
		case EventName.MEETING_LEAVE_NOTIFICATION: {
			return new Audio(meetingOut).play();
		}
		case EventName.MEETING_AUDIO_ON: {
			return new Audio(audioOn).play();
		}
		case EventName.MEETING_AUDIO_OFF: {
			return new Audio(audioOff).play();
		}
		case EventName.MEETING_SCREENSHARE_NOTIFICATION: {
			return new Audio(screenshareOn).play();
		}
		default:
			return undefined;
	}
};
