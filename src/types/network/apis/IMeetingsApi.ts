/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { JoinSettings } from '../models/meetingBeTypes';
import {
	CloseAudioStreamResponse,
	CloseScreenShareStreamResponse,
	CloseVideoStreamResponse,
	DeleteMeetingResponse,
	GetMeetingResponse,
	JoinMeetingResponse,
	LeaveMeetingResponse,
	ListMeetingsResponse,
	OpenAudioStreamResponse,
	OpenScreenShareStreamResponse,
	OpenVideoStreamResponse
} from '../responses/meetingsResponses';

interface IMeetingsApi {
	listMeetings(): Promise<ListMeetingsResponse>;
	getMeeting(roomId: string): Promise<GetMeetingResponse>;
	getMeetingByMeetingId(meetingId: string): Promise<GetMeetingResponse>;
	joinMeeting(roomId: string, settings: JoinSettings): Promise<JoinMeetingResponse>;
	joinMeetingByMeetingId(meetingId: string, settings: JoinSettings): Promise<JoinMeetingResponse>;
	leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse>;
	deleteMeeting(meetingId: string): Promise<DeleteMeetingResponse>;
	openVideoStream(meetingId: string): Promise<OpenVideoStreamResponse>;
	closeVideoStream(meetingId: string, sessionId: string): Promise<CloseVideoStreamResponse>;
	openAudioStream(meetingId: string): Promise<OpenAudioStreamResponse>;
	closeAudioStream(meetingId: string, sessionId: string): Promise<CloseAudioStreamResponse>;
	openScreenShareStream(meetingId: string): Promise<OpenScreenShareStreamResponse>;
	closeScreenShareStream(
		meetingId: string,
		sessionId: string
	): Promise<CloseScreenShareStreamResponse>;
}

export default IMeetingsApi;
