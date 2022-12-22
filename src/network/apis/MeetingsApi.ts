/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import IMeetingsApi from '../../types/network/apis/IMeetingsApi';
import { JoinSettings } from '../../types/network/models/meetingBeTypes';
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
} from '../../types/network/responses/meetingsResponses';
import BaseAPI from './BaseAPI';

class MeetingsApi extends BaseAPI implements IMeetingsApi {
	// Singleton design pattern
	private static instance: IMeetingsApi;

	public static getInstance(): IMeetingsApi {
		if (!MeetingsApi.instance) {
			MeetingsApi.instance = new MeetingsApi();
		}
		return MeetingsApi.instance;
	}

	public listMeetings(): Promise<ListMeetingsResponse> {
		return this.fetchAPI(`meetings`, RequestType.GET).then((resp: ListMeetingsResponse) => {
			const { setMeetings } = useStore.getState();
			setMeetings(resp);
			return resp;
		});
	}

	getMeeting(roomId: string): Promise<GetMeetingResponse> {
		return this.fetchAPI(`rooms/${roomId}/meeting`, RequestType.GET);
	}

	public getMeetingByMeetingId(meetingId: string): Promise<GetMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}`, RequestType.GET);
	}

	public joinMeeting(roomId: string, settings: JoinSettings): Promise<JoinMeetingResponse> {
		return this.fetchAPI(`rooms/${roomId}/meeting/join`, RequestType.PUT, settings);
	}

	public joinMeetingByMeetingId(
		meetingId: string,
		settings: JoinSettings
	): Promise<JoinMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/join`, RequestType.PUT, settings);
	}

	public leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/leave`, RequestType.PUT);
	}

	public deleteMeeting(meetingId: string): Promise<DeleteMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}`, RequestType.DELETE);
	}

	public openVideoStream(meetingId: string): Promise<OpenVideoStreamResponse> {
		return this.fetchAPI(`meetings/${meetingId}/video`, RequestType.PUT);
	}

	public closeVideoStream(meetingId: string, sessionId: string): Promise<CloseVideoStreamResponse> {
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/video`, RequestType.DELETE);
	}

	public openAudioStream(meetingId: string): Promise<OpenAudioStreamResponse> {
		return this.fetchAPI(`meetings/${meetingId}/audio`, RequestType.PUT);
	}

	public closeAudioStream(meetingId: string, sessionId: string): Promise<CloseAudioStreamResponse> {
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/audio`, RequestType.DELETE);
	}

	public openScreenShareStream(meetingId: string): Promise<OpenScreenShareStreamResponse> {
		return this.fetchAPI(`meetings/${meetingId}/screen`, RequestType.PUT);
	}

	public closeScreenShareStream(
		meetingId: string,
		sessionId: string
	): Promise<CloseScreenShareStreamResponse> {
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/screen`, RequestType.DELETE);
	}
}

export default MeetingsApi.getInstance();
