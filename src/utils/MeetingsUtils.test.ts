/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MeetingSoundFeedback, sendAudioFeedback } from './MeetingsUtils';

describe('MeetingsUtils - audio feedback', () => {
	test('test return of meetingIn notification', () => {
		const mockAudio = jest
			.spyOn(window.HTMLMediaElement.prototype, 'play')
			.mockImplementation(() => Promise.resolve());

		sendAudioFeedback(MeetingSoundFeedback.MEETING_JOIN_NOTIFICATION);
		sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_ON);
		sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_OFF);
		sendAudioFeedback(MeetingSoundFeedback.MEETING_SCREENSHARE_NOTIFICATION);
		sendAudioFeedback(MeetingSoundFeedback.MEETING_LEAVE_NOTIFICATION);

		expect(mockAudio).toHaveBeenCalledTimes(5);
	});
});
