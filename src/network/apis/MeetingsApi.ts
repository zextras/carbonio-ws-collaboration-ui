/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import BaseAPI from './BaseAPI';
import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import IMeetingsApi from '../../types/network/apis/IMeetingsApi';
import {
	CreateMeetingData,
	JoinSettings,
	MeetingType
} from '../../types/network/models/meetingBeTypes';
import {
	AcceptWaitingUserResponse,
	CreateAudioOfferResponse,
	CreateMediaAnswerResponse,
	CreateMeetingResponse,
	DeleteMeetingResponse,
	GetMeetingResponse,
	GetScheduledMeetingNameResponse,
	GetWaitingListResponse,
	JoinMeetingResponse,
	LeaveMeetingResponse,
	ListMeetingsResponse,
	StartMeetingResponse,
	StartRecordingResponse,
	StopMeetingResponse,
	StopRecordingResponse,
	SubscribeMediaResponse,
	UpdateAudioStreamStatusResponse,
	UpdateMediaOfferResponse
} from '../../types/network/responses/meetingsResponses';
import { STREAM_TYPE, Subscription } from '../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RoomsApi } from '../index';

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

	public createMeeting(
		roomId: string,
		meetingType: MeetingType,
		name: string,
		expiration?: string
	): Promise<CreateMeetingResponse> {
		const createMeetingData: CreateMeetingData = {
			roomId,
			meetingType,
			name,
			expiration
		};
		return this.fetchAPI(`meetings`, RequestType.POST, createMeetingData);
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
			if (resp.status === 'ACCEPTED') {
				useStore
					.getState()
					.meetingConnection(
						meetingId,
						settings.audioStreamEnabled,
						devicesId.audioDevice,
						settings.videoStreamEnabled,
						devicesId.videoDevice
					);
				return this.getMeetingByMeetingId(meetingId).then((meeting) => {
					if (meeting.meetingType === MeetingType.SCHEDULED) {
						const room = find(useStore.getState().rooms, (room) => room.meetingId === meetingId);
						const iAmOwner = find(
							room?.members,
							(member) => member.userId === useStore.getState().session.id && member.owner
						);
						if (iAmOwner) this.getWaitingList(meetingId);
					}
					return resp;
				});
			}
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
		const roomName = useStore.getState().rooms[roomId]?.name || '';
		return this.createMeeting(roomId, MeetingType.PERMANENT, roomName).then((response) =>
			this.startMeeting(response.id).then(() =>
				this.joinMeeting(response.id, settings, devicesId).then(() => response.id)
			)
		);
	}

	public leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse> {
		const room = find(useStore.getState().rooms, (room) => room.meetingId === meetingId);
		const iAmNotOwner = find(
			room?.members,
			(member) => member.userId === useStore.getState().session.id && !member.owner
		);
		return this.fetchAPI(`meetings/${meetingId}/leave`, RequestType.POST).then(
			(resp: LeaveMeetingResponse) => {
				useStore.getState().meetingDisconnection(meetingId);

				// Leave temporary room when a member leaves the scheduled meeting
				if (room?.type === RoomType.TEMPORARY && iAmNotOwner) {
					RoomsApi.deleteRoomMember(room.id, useStore.getState().session.id || '');
				}
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

	public getScheduledMeetingName(meetingId: string): Promise<GetScheduledMeetingNameResponse> {
		return this.fetchAPI(`public/meetings/${meetingId}`, RequestType.GET, undefined);
	}

	public leaveWaitingRoom(meetingId: string): Promise<AcceptWaitingUserResponse> {
		const userId = useStore.getState().session.id;
		return this.fetchAPI(`meetings/${meetingId}/queue/${userId}`, RequestType.POST, {
			status: 'REJECTED'
		});
	}

	public getWaitingList(meetingId: string): Promise<GetWaitingListResponse> {
		return this.fetchAPI(`meetings/${meetingId}/queue`, RequestType.GET).then((resp) => {
			useStore.getState().setWaitingList(meetingId, resp.users);
			return resp;
		});
	}

	public acceptWaitingUser(
		meetingId: string,
		userId: string,
		accept: boolean
	): Promise<AcceptWaitingUserResponse> {
		const status = accept ? 'ACCEPTED' : 'REJECTED';
		return this.fetchAPI(`meetings/${meetingId}/queue/${userId}`, RequestType.POST, {
			status
		});
	}

	startRecording(meetingId: string): Promise<StartRecordingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/startRecording`, RequestType.POST);
	}

	stopRecording(
		meetingId: string,
		recordingName: string,
		folderId: string
	): Promise<StopRecordingResponse> {
		return this.fetchAPI(`meetings/${meetingId}/stopRecording`, RequestType.POST, {
			name: recordingName,
			folderId
		});
	}
}

export default MeetingsApi.getInstance();
