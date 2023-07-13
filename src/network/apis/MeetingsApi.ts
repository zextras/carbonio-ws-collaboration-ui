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

	public changeVideoStream(
		meetingId: string,
		enabled: boolean
	): Promise<ChangeVideoStreamResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/video`, RequestType.PUT, {
			enabled
		}).then((resp: ChangeAudioStreamResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, sessionId!, 'video', enabled);
			return resp;
		});
	}

	public changeAudioStream(
		meetingId: string,
		enabled: boolean
	): Promise<ChangeAudioStreamResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/audio`, RequestType.PUT, {
			enabled
		}).then((resp: ChangeAudioStreamResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, sessionId!, 'audio', enabled);
			return resp;
		});
	}

	public changeScreenStream(
		meetingId: string,
		enabled: boolean
	): Promise<ChangeScreenStreamResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/screen`, RequestType.PUT, {
			enabled
		}).then((resp: ChangeScreenStreamResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, sessionId!, 'screen', enabled);
			return resp;
		});
	}

	public createAudioOffer(
		meetingId: string,
		sdpOffer: RTCSessionDescriptionInit
	): Promise<CreateAudioOfferResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(
			`meetings/${meetingId}/sessions/${sessionId}/audio/offer`,
			RequestType.PUT,
			{
				type: 'offer',
				sdp: sdpOffer
			}
		).then((resp: CreateAudioOfferResponse) => resp);
	}

	public createVideoOffer(
		meetingId: string,
		sdpOffer: RTCSessionDescriptionInit
	): Promise<CreateVideoOfferResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(
			`meetings/${meetingId}/sessions/${sessionId}/video/offer`,
			RequestType.PUT,
			{
				type: 'offer',
				sdp: sdpOffer
			}
		).then((resp: CreateVideoOfferResponse) => resp);
	}
}

export default MeetingsApi.getInstance();
