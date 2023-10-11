/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import audioOff from '../meetings/assets/AudioOFF.mp3';
import audioOn from '../meetings/assets/AudioON.mp3';
import meetingIn from '../meetings/assets/MeetingIN.mp3';
import meetingOut from '../meetings/assets/MeetingOUT.mp3';
import screenshareOn from '../meetings/assets/ScreenShareON.mp3';

export enum MeetingSoundFeedback {
	MEETING_JOIN_NOTIFICATION = 'meetingJoinNotification',
	MEETING_LEAVE_NOTIFICATION = 'meetingLeaveNotification',
	MEETING_SCREENSHARE_NOTIFICATION = 'meetingScreenshareNotification',
	MEETING_AUDIO_ON = 'meetingAudioOn',
	MEETING_AUDIO_OFF = 'meetingAudioOff'
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
		default:
			return undefined;
	}
};

export const maximiseRowsAndColumns = (
	dimensions: { width: number; height: number },
	tileWidth: number
): { rows: number; columns: number } => {
	const tileHeight = tileWidth * (9 / 16);
	const rows = Math.floor(dimensions.height / tileHeight);
	const columns = Math.floor(dimensions.width / tileWidth);

	return { rows, columns };
};

export const maximiseTileSize = (
	dimensions: { width: number; height: number },
	numbersOfTiles: number
): { tileWidth: number; rows: number; columns: number } => {
	const containerRatio = dimensions.width / dimensions.height;
	if (containerRatio > 16 / 9) {
		// More wide than tall
		// TODO
	} else {
		// More tall than wide
		// TODO
	}
	const tileWidth = dimensions.width / numbersOfTiles;
	const rows = 1;
	const columns = 1;

	return { tileWidth, rows, columns };
};
