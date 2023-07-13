/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { JoinSettings } from '../models/meetingBeTypes';
import {
	ChangeAudioStreamResponse,
	ChangeScreenStreamResponse,
	ChangeVideoStreamResponse,
	CreateAudioOfferResponse,
	CreateVideoOfferResponse,
	DeleteMeetingResponse,
	GetMeetingResponse,
	JoinMeetingResponse,
	LeaveMeetingResponse,
	ListMeetingsResponse
} from '../responses/meetingsResponses';

interface IMeetingsApi {
	listMeetings(): Promise<ListMeetingsResponse>;
	getMeeting(roomId: string): Promise<GetMeetingResponse>;
	getMeetingByMeetingId(meetingId: string): Promise<GetMeetingResponse>;
	joinMeeting(roomId: string, settings: JoinSettings): Promise<JoinMeetingResponse>;
	joinMeetingByMeetingId(meetingId: string, settings: JoinSettings): Promise<JoinMeetingResponse>;
	leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse>;
	deleteMeeting(meetingId: string): Promise<DeleteMeetingResponse>;
	changeVideoStream(meetingId: string, enabled: boolean): Promise<ChangeVideoStreamResponse>;
	changeAudioStream(meetingId: string, enabled: boolean): Promise<ChangeAudioStreamResponse>;
	changeScreenStream(meetingId: string, enabled: boolean): Promise<ChangeScreenStreamResponse>;
	createAudioOffer(
		meetingId: string,
		sdpOffer: RTCSessionDescriptionInit
	): Promise<CreateAudioOfferResponse>;
	createVideoOffer(
		meetingId: string,
		sdpOffer: RTCSessionDescriptionInit
	): Promise<CreateVideoOfferResponse>;
}

export default IMeetingsApi;
