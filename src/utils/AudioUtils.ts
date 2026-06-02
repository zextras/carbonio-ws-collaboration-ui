/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import audioOff from '../meetings/assets/AudioOFF.mp3';
import audioOn from '../meetings/assets/AudioON.mp3';
import meetingIn from '../meetings/assets/MeetingIN.mp3';
import raiseHandSound from '../meetings/assets/raiseHand.mp3';
import screenshareOn from '../meetings/assets/ScreenShareON.mp3';
import waitingUserSound from '../meetings/assets/waitingUserOnQueue.mp3';
import { AudioType } from 'wsc-shared';

const SOUND_MAP: Record<AudioType | string, string> = {
	[AudioType.MEETING_JOIN_NOTIFICATION]: meetingIn,
	[AudioType.MEETING_AUDIO_ON]: audioOn,
	[AudioType.MEETING_AUDIO_OFF]: audioOff,
	[AudioType.MEETING_SCREENSHARE_NOTIFICATION]: screenshareOn,
	[AudioType.NEW_WAITING_USER]: waitingUserSound,
	[AudioType.NEW_HAND_RAISED]: raiseHandSound
};

export const playAudio = (type: AudioType | string): void => {
	const soundSrc = SOUND_MAP[type];
	if (!soundSrc) return undefined;

	const audio = new Audio(soundSrc);
	audio.volume = 0.5;
	audio.play();
	return undefined;
};
