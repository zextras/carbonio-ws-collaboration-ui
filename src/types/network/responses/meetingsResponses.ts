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

export type ChangeVideoStreamResponse = Response;

export type ChangeAudioStreamResponse = Response;

export type ChangeScreenStreamResponse = Response;

export type CreateAudioOfferResponse = Response;

export type CreateVideoOfferResponse = Response;
