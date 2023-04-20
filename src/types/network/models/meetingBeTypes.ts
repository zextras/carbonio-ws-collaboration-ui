/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type MeetingBe = {
	id: string;
	roomId: string;
	participants: MeetingParticipantBe[];
	createdAt: string;
};

export type MeetingParticipantBe = {
	userId: string;
	sessionId: string;
	audioStreamOn: boolean;
	videoStreamOn: boolean;
	screenStreamOn?: boolean;
};

export type JoinSettings = {
	audioStreamOn?: boolean;
	videoStreamOn?: boolean;
};
