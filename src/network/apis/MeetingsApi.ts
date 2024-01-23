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
	CreatePermanentMeetingData,
	CreateScheduledMeetingData,
	JoinSettings,
	MeetingType,
	MeetingUser
} from '../../types/network/models/meetingBeTypes';
import {
	CreateAudioOfferResponse,
	CreateMediaAnswerResponse,
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
import { STREAM_TYPE, Subscription } from '../../types/store/ActiveMeetingTypes';

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

	public createPermanentMeeting(roomId: string): Promise<CreateMeetingResponse> {
		const createPermanentMeetingData: CreatePermanentMeetingData = {
			name: '',
			users: [],
			roomId,
			meetingType: MeetingType.PERMANENT
		};
		return this.fetchAPI(`meetings`, RequestType.POST, createPermanentMeetingData);
	}

	public createScheduledMeeting(
		name: string,
		users: MeetingUser[],
		roomId: string,
		expiration?: string
	): Promise<CreateMeetingResponse> {
		const createScheduledMeetingData: CreateScheduledMeetingData = {
			name,
			users,
			meetingType: MeetingType.SCHEDULED,
			roomId,
			expiration
		};
		return this.fetchAPI(`meetings`, RequestType.POST, createScheduledMeetingData);
	}

	public getMeeting(roomId: string): Promise<GetMeetingResponse> {
		return this.fetchAPI(`rooms/${roomId}/meeting`, RequestType.GET);
	}

	public getMeetingByMeetingId(meetingId: string): Promise<GetMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}`, RequestType.GET).then(
			(resp: GetMeetingResponse) => {
				const { addMeeting } = useStore.getState();
				addMeeting(resp);
				return resp;
			}
		);
	}

	public startMeeting(meetingId: string): Promise<StartMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/start`, RequestType.POST);
	}

	public joinMeeting(
		meetingId: string,
		settings: JoinSettings,
		devicesId: { audioDevice?: string; videoDevice?: string }
	): Promise<JoinMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/join`, RequestType.POST, settings).then((resp) => {
			useStore
				.getState()
				.meetingConnection(
					meetingId,
					settings.audioStreamEnabled,
					devicesId.audioDevice,
					settings.videoStreamEnabled,
					devicesId.videoDevice
				);
			this.getMeetingByMeetingId(meetingId).then((meeting) => {
				useStore
					.getState()
					.activeMeeting[meetingId]?.videoScreenIn?.subscriptionManager.updateAllStreamMap(
						meeting.participants
					);
			});
			return resp;
		});
	}

	public enterMeeting(
		roomId: string,
		settings: JoinSettings,
		devicesId: { audioDevice?: string; videoDevice?: string }
	): Promise<string> {
		const meeting = useStore.getState().meetings[roomId];
		if (meeting) {
			if (meeting.active) {
				return this.joinMeeting(meeting.id, settings, devicesId).then(() => meeting.id);
			}
			return this.startMeeting(meeting.id).then(() =>
				this.joinMeeting(meeting.id, settings, devicesId).then(() => meeting.id)
			);
		}
		return this.createPermanentMeeting(roomId).then((response) =>
			this.startMeeting(response.id).then(() =>
				this.joinMeeting(response.id, settings, devicesId).then(() => response.id)
			)
		);
	}

	public leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/leave`, RequestType.POST).then(
			(resp: LeaveMeetingResponse) => {
				useStore.getState().meetingDisconnection(meetingId);
				return resp;
			}
		);
	}

	public stopMeeting(meetingId: string): Promise<StopMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/stop`, RequestType.POST);
	}

	public deleteMeeting(meetingId: string): Promise<DeleteMeetingResponse> {
		return this.fetchAPI(`meetings/${meetingId}`, RequestType.DELETE).then(
			(resp: DeleteMeetingResponse) => {
				useStore.getState().meetingDisconnection(meetingId);
				return resp;
			}
		);
	}

	public createAudioOffer(meetingId: string, sdpOffer: string): Promise<CreateAudioOfferResponse> {
		return this.fetchAPI(`meetings/${meetingId}/audio/offer`, RequestType.PUT, {
			sdp: sdpOffer
		});
	}

	public updateAudioStreamStatus(
		meetingId: string,
		enabled: boolean,
		userToModerate?: string
	): Promise<UpdateAudioStreamStatusResponse> {
		return this.fetchAPI(`meetings/${meetingId}/audio`, RequestType.PUT, {
			enabled,
			userToModerate
		});
	}

	public updateMediaOffer(
		meetingId: string,
		type: STREAM_TYPE,
		enabled: boolean,
		sdp?: string
	): Promise<UpdateMediaOfferResponse> {
		return this.fetchAPI(`meetings/${meetingId}/media`, RequestType.PUT, {
			type,
			enabled,
			sdp
		});
	}

	public subscribeToMedia(
		meetingId: string,
		subscription: Subscription[],
		unsubscription: Subscription[]
	): Promise<SubscribeMediaResponse> {
		return this.fetchAPI(`meetings/${meetingId}/media/subscribe`, RequestType.PUT, {
			subscribe: subscription,
			unsubscribe: unsubscription
		});
	}

	public createMediaAnswer(
		meetingId: string,
		sdpAnswer: string
	): Promise<CreateMediaAnswerResponse> {
		return this.fetchAPI(`meetings/${meetingId}/media/answer`, RequestType.PUT, {
			sdp: sdpAnswer
		});
	}
}

export default MeetingsApi.getInstance();
