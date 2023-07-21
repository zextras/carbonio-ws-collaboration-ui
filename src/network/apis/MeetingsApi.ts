/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import BaseAPI from './BaseAPI';
import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import IMeetingsApi from '../../types/network/apis/IMeetingsApi';
import {
	CreateMeetingData,
	JoinSettings,
	MeetingType,
	MeetingUser
} from '../../types/network/models/meetingBeTypes';
import {
	CreateMeetingResponse,
	CreateAudioOfferResponse,
	CreateVideoOfferResponse,
	DeleteMeetingResponse,
	GetMeetingResponse,
	JoinMeetingResponse,
	LeaveMeetingResponse,
	ListMeetingsResponse,
	StartMeetingResponse,
	StopMeetingResponse,
	UpdateAudioStreamStatusResponse,
	UpdateScreenStreamStatusResponse,
	UpdateVideoStreamStatusResponse
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

	private createMeeting(createMeetingData: CreateMeetingData): Promise<CreateMeetingResponse> {
		return this.fetchAPI(`meetings`, RequestType.POST, createMeetingData);
	}

	public createPermanentMeeting(roomId: string): Promise<CreateMeetingResponse> {
		return this.createMeeting({
			name: '',
			users: [],
			roomId,
			meetingType: MeetingType.PERMANENT
		});
	}

	public createScheduledMeeting(
		name: string,
		users: MeetingUser[],
		roomId: string,
		expiration?: number
	): Promise<CreateMeetingResponse> {
		return this.createMeeting({
			name,
			users,
			roomId,
			meetingType: MeetingType.SCHEDULED,
			expiration
		});
	}

	public getMeeting(roomId: string): Promise<GetMeetingResponse> {
		return this.fetchAPI(`rooms/${roomId}/meeting`, RequestType.GET);
	}

	public getMeetingByMeetingId(meetingId: string): Promise<GetMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}`, RequestType.GET);
	}

	public startMeeting(meetingId: string): Promise<StartMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/start`, RequestType.POST);
	}

	public joinMeeting(meetingId: string, settings: JoinSettings): Promise<JoinMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/join`, RequestType.POST, settings);
	}

	public joinMeetingByRoomId(roomId: string, settings: JoinSettings): Promise<JoinMeetingResponse> {
		return this.fetchAPI(`rooms/${roomId}/meeting/join`, RequestType.PUT, settings);
	}

	public leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/leave`, RequestType.POST);
	}

	public stopMeeting(meetingId: string): Promise<StopMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/stop`, RequestType.POST);
	}

	public deleteMeeting(meetingId: string): Promise<DeleteMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}`, RequestType.DELETE);
	}

	public updateAudioStreamStatus(
		meetingId: string,
		enabled: boolean
	): Promise<UpdateAudioStreamStatusResponse> {
		const { sessionId, id } = useStore.getState().session;
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/audio`, RequestType.PUT, {
			enabled
		}).then((resp: UpdateAudioStreamStatusResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, id!, 'audio', enabled);
			return resp;
		});
	}

	public updateVideoStreamStatus(
		meetingId: string,
		enabled: boolean
	): Promise<UpdateVideoStreamStatusResponse> {
		const { sessionId, id } = useStore.getState().session;
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/video`, RequestType.PUT, {
			enabled
		}).then((resp: UpdateVideoStreamStatusResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, id!, 'video', enabled);
			return resp;
		});
	}

	public updateScreenStreamStatus(
		meetingId: string,
		enabled: boolean
	): Promise<UpdateScreenStreamStatusResponse> {
		const { sessionId, id } = useStore.getState().session;
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/screen`, RequestType.PUT, {
			enabled
		}).then((resp: UpdateScreenStreamStatusResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, id!, 'screen', enabled);
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
