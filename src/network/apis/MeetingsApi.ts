/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import BaseAPI from './BaseAPI';
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

	public getMeeting(roomId: string): Promise<GetMeetingResponse> {
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
		return this.fetchAPI(`meetings/${meetingId}/video`, RequestType.PUT).then(
			(resp: OpenVideoStreamResponse) => {
				const { changeStreamStatus, session } = useStore.getState();
				changeStreamStatus(meetingId, session.sessionId!, 'video', true);
				return resp;
			}
		);
	}

	public closeVideoStream(meetingId: string): Promise<CloseVideoStreamResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(
			`meetings/${meetingId}/sessions/${sessionId}/video`,
			RequestType.DELETE
		).then((resp: CloseVideoStreamResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, sessionId!, 'video', false);
			return resp;
		});
	}

	public openAudioStream(meetingId: string): Promise<OpenAudioStreamResponse> {
		return this.fetchAPI(`meetings/${meetingId}/audio`, RequestType.PUT).then(
			(resp: OpenAudioStreamResponse) => {
				const { changeStreamStatus, session } = useStore.getState();
				changeStreamStatus(meetingId, session.sessionId!, 'audio', true);
				return resp;
			}
		);
	}

	public closeAudioStream(meetingId: string): Promise<CloseAudioStreamResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(
			`meetings/${meetingId}/sessions/${sessionId}/audio`,
			RequestType.DELETE
		).then((resp: CloseAudioStreamResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, sessionId!, 'audio', false);
			return resp;
		});
	}

	public openScreenShareStream(meetingId: string): Promise<OpenScreenShareStreamResponse> {
		return this.fetchAPI(`meetings/${meetingId}/screen`, RequestType.PUT).then(
			(resp: OpenScreenShareStreamResponse) => {
				const { changeStreamStatus, session } = useStore.getState();
				changeStreamStatus(meetingId, session.sessionId!, 'screen', true);
				return resp;
			}
		);
	}

	public closeScreenShareStream(meetingId: string): Promise<CloseScreenShareStreamResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(
			`meetings/${meetingId}/sessions/${sessionId}/screen`,
			RequestType.DELETE
		).then((resp: CloseScreenShareStreamResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, sessionId!, 'screen', false);
			return resp;
		});
	}
}

export default MeetingsApi.getInstance();
