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
	CreateAudioOfferResponse,
	CreateMeetingResponse,
	DeleteMeetingResponse,
	GetMeetingResponse,
	JoinMeetingResponse,
	LeaveMeetingResponse,
	ListMeetingsResponse,
	StartMeetingResponse,
	StopMeetingResponse,
	SubscribeMediaResponse,
	UpdateAudioStreamStatusResponse,
	UpdateMediaOfferResponse
} from '../../types/network/responses/meetingsResponses';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';

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
		return this.fetchAPI(`meetings/${meetingId}/join`, RequestType.POST, settings).then(
			(resp: JoinMeetingResponse) => {
				useStore.getState().setActiveMeeting(meetingId);
				return resp;
			}
		);
	}

	public enterMeeting(roomId: string, settings: JoinSettings): Promise<string> {
		const meeting = useStore.getState().meetings[roomId];
		if (meeting) {
			if (meeting.active) {
				return this.joinMeeting(meeting.id, settings).then(() => meeting.id);
			}
			return this.startMeeting(meeting.id).then(() =>
				this.joinMeeting(meeting.id, settings).then(() => meeting.id)
			);
		}
		return this.createPermanentMeeting(roomId).then((response) =>
			this.startMeeting(response.id).then(() =>
				this.joinMeeting(response.id, settings).then(() => response.id)
			)
		);
	}

	public leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/leave`, RequestType.POST).then(
			(resp: LeaveMeetingResponse) => {
				useStore.getState().removeActiveMeeting(meetingId);
				return resp;
			}
		);
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
			changeStreamStatus(meetingId, id!, STREAM_TYPE.AUDIO, enabled);
			return resp;
		});
	}

	public createAudioOffer(meetingId: string, sdpOffer: string): Promise<CreateAudioOfferResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(
			`meetings/${meetingId}/sessions/${sessionId}/audio/offer`,
			RequestType.PUT,
			{
				sdp: sdpOffer
			}
		).then((resp: CreateAudioOfferResponse) => resp);
	}

	public updateMediaOffer(
		meetingId: string,
		type: STREAM_TYPE,
		enabled: boolean,
		sdp?: string
	): Promise<UpdateMediaOfferResponse> {
		const { sessionId, id } = useStore.getState().session;
		return this.fetchAPI(`meetings/${meetingId}/sessions/${sessionId}/media`, RequestType.PUT, {
			type,
			enabled,
			sdp
		}).then((resp: UpdateMediaOfferResponse) => {
			const { changeStreamStatus } = useStore.getState();
			changeStreamStatus(meetingId, id!, type, enabled);
			return resp;
		});
	}

	public subscribeToMedia(
		meetingId: string,
		userSessionId: string,
		type: STREAM_TYPE
	): Promise<SubscribeMediaResponse> {
		const { sessionId } = useStore.getState().session;
		return this.fetchAPI(
			`meetings/${meetingId}/sessions/${sessionId}/media/subscribe`,
			RequestType.PUT,
			{
				subscribe: [
					{
						session_id: userSessionId,
						type
					}
				],
				unsubscribe: []
			}
		).then((resp: SubscribeMediaResponse) => resp);
	}
}

export default MeetingsApi.getInstance();
