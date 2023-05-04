/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MeetingBe } from '../models/meetingBeTypes';

export type ListMeetingsResponse = MeetingBe[];

export type GetMeetingResponse = MeetingBe;

export type JoinMeetingResponse = MeetingBe;

export type LeaveMeetingResponse = Response;

export type DeleteMeetingResponse = Response;

export type OpenVideoStreamResponse = Response;

export type CloseVideoStreamResponse = Response;

export type OpenAudioStreamResponse = Response;

export type CloseAudioStreamResponse = Response;

export type OpenScreenShareStreamResponse = Response;

export type CloseScreenShareStreamResponse = Response;