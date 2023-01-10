/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export type MeetingsMap = {
	[roomId: string]: Meeting;
};

export type Meeting = {
	id: string;
	roomId: string;
	participants: MeetingParticipant[];
	createdAt: string;
};

export type MeetingParticipant = {
	userId: string;
	sessionId: string;
	hasAudioStreamOn: boolean;
	hasVideoStreamOn: boolean;
};
