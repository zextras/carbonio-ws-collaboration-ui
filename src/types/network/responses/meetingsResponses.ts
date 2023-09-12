/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MeetingBe } from '../models/meetingBeTypes';

export type ListMeetingsResponse = MeetingBe[];

export type CreateMeetingResponse = MeetingBe;

export type GetMeetingResponse = MeetingBe;

export type StartMeetingResponse = Response;

export type JoinMeetingResponse = MeetingBe;

export type LeaveMeetingResponse = Response;

export type StopMeetingResponse = Response;

export type DeleteMeetingResponse = Response;

export type UpdateAudioStreamStatusResponse = Response;

export type CreateAudioOfferResponse = Response;

export type UpdateMediaOfferResponse = Response;

export type SubscribeMediaResponse = Response;

export type CreateMediaAnswerResponse = Response;
