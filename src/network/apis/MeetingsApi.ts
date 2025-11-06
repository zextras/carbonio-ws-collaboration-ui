/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { chain, find } from 'lodash';
import { lte } from 'semver';

import { getMeetingByRoomId } from '../../store/selectors/MeetingSelectors';
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
	CreateGuestAccountResponse,
	CreateMediaAnswerResponse,
	CreateMeetingResponse,
	DeleteMeetingResponse,
	GetMeetingResponse,
	GetScheduledMeetingNameResponse,
	GetWaitingListResponse,
	JoinMeetingResponse,
	LeaveMeetingResponse,
	ListMeetingsResponse,
	LoginV3ConfigResponse,
	RaiseHandResponse,
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
import { UserType } from '../../types/store/UserTypes';
import { BrowserUtils } from '../../utils/BrowserUtils';
import { dateToTimestamp, formatDate } from '../../utils/dateUtils';
import { fetchAPI } from '../../utils/FetchUtils';
import { RoomsApi } from '../index';

class MeetingsApi implements IMeetingsApi {
	// Singleton design pattern
	private static instance: IMeetingsApi;

	public static getInstance(): IMeetingsApi {
		if (!MeetingsApi.instance) {
			MeetingsApi.instance = new MeetingsApi();
		}
		return MeetingsApi.instance;
	}

	public listMeetings(): Promise<ListMeetingsResponse> {
		return fetchAPI(`meetings`, RequestType.GET).then((resp: ListMeetingsResponse) => {
			const { addMeetings } = useStore.getState();
			addMeetings(resp);
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
		return fetchAPI(`meetings`, RequestType.POST, createMeetingData);
	}

	public getMeeting(roomId: string): Promise<GetMeetingResponse> {
		return fetchAPI(`rooms/${roomId}/meeting`, RequestType.GET);
	}

	public getMeetingByMeetingId(meetingId: string): Promise<GetMeetingResponse> {
		return fetchAPI(`meetings/${meetingId}`, RequestType.GET).then((resp: GetMeetingResponse) => {
			const { addMeetings } = useStore.getState();
			addMeetings([resp]);
			return resp;
		});
	}

	public startMeeting(meetingId: string): Promise<StartMeetingResponse> {
		return fetchAPI(`meetings/${meetingId}/start`, RequestType.POST);
	}

	public joinMeeting(
		meetingId: string,
		settings: JoinSettings,
		devicesId: { audioDevice?: string; videoDevice?: string }
	): Promise<JoinMeetingResponse> {
		return fetchAPI(`meetings/${meetingId}/join`, RequestType.POST, settings).then((resp) => {
			if (resp.status === 'ACCEPTED') {
				useStore
					.getState()
					.meetingConnection(
						meetingId,
						{ enabled: settings.audioStreamEnabled, deviceId: devicesId.audioDevice },
						{ enabled: settings.videoStreamEnabled, deviceId: devicesId.videoDevice }
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
					// order hand raised if there's any
					chain(meeting.participants)
						.filter((p) => p.handRaisedAt !== undefined)
						.sortBy((p) => dateToTimestamp(new Date(p.handRaisedAt ?? new Date())))
						.each((participant) => {
							useStore.getState().setUserWithHandRaised(participant.userId, true);
						})
						.value();
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
		const meeting = getMeetingByRoomId(useStore.getState(), roomId);
		if (meeting) {
			if (meeting.active) {
				return this.joinMeeting(meeting.id, settings, devicesId).then(() => meeting.id);
			}
			return this.startMeeting(meeting.id).then(() =>
				this.joinMeeting(meeting.id, settings, devicesId).then(() => meeting.id)
			);
		}
		const roomName = useStore.getState().rooms[roomId]?.name ?? '';
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
		const isExternal = useStore.getState().session?.userType === UserType.GUEST;
		return fetchAPI(`meetings/${meetingId}/leave`, RequestType.POST)
			.then((resp: LeaveMeetingResponse) => {
				useStore.getState().meetingDisconnection(meetingId);

				// DEPRECATED: This function exists for backward compatibility with previous versions.
				//  * Remove once support for v1.6.2 is officially dropped.
				// Leave temporary room when a member leaves the scheduled meeting
				const version = useStore.getState().session.apiVersion;
				if (
					(!version || lte(version, '1.6.2')) &&
					room?.type === RoomType.TEMPORARY &&
					iAmNotOwner
				) {
					RoomsApi.deleteRoomMember(room.id, useStore.getState().session.id ?? '');
				}
				if (isExternal) {
					BrowserUtils.clearAuthCookies();
				}
				return resp;
			})
			.catch((err) => {
				if (isExternal) {
					BrowserUtils.clearAuthCookies();
				}
				return err;
			});
	}

	public stopMeeting(meetingId: string): Promise<StopMeetingResponse> {
		return fetchAPI(`meetings/${meetingId}/stop`, RequestType.POST);
	}

	public deleteMeeting(meetingId: string): Promise<DeleteMeetingResponse> {
		return fetchAPI(`meetings/${meetingId}`, RequestType.DELETE).then(
			(resp: DeleteMeetingResponse) => {
				useStore.getState().meetingDisconnection(meetingId);
				return resp;
			}
		);
	}

	public createAudioOffer(meetingId: string, sdpOffer: string): Promise<CreateAudioOfferResponse> {
		return fetchAPI(`meetings/${meetingId}/audio/offer`, RequestType.PUT, {
			sdp: sdpOffer
		});
	}

	public updateAudioStreamStatus(
		meetingId: string,
		enabled: boolean,
		userToModerate?: string
	): Promise<UpdateAudioStreamStatusResponse> {
		return fetchAPI(`meetings/${meetingId}/audio`, RequestType.PUT, {
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
		return fetchAPI(`meetings/${meetingId}/media`, RequestType.PUT, {
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
		return fetchAPI(`meetings/${meetingId}/media/subscribe`, RequestType.PUT, {
			subscribe: subscription,
			unsubscribe: unsubscription
		});
	}

	public createMediaAnswer(
		meetingId: string,
		sdpAnswer: string
	): Promise<CreateMediaAnswerResponse> {
		return fetchAPI(`meetings/${meetingId}/media/answer`, RequestType.PUT, {
			sdp: sdpAnswer
		});
	}

	public getScheduledMeetingName(meetingId: string): Promise<GetScheduledMeetingNameResponse> {
		return fetchAPI(`public/meetings/${meetingId}`, RequestType.GET);
	}

	public leaveWaitingRoom(meetingId: string): Promise<AcceptWaitingUserResponse> {
		const userId = useStore.getState().session.id;
		return fetchAPI(`meetings/${meetingId}/queue/${userId}`, RequestType.POST, {
			status: 'REJECTED'
		}).finally(() => {
			const isExternal = useStore.getState().session?.userType === UserType.GUEST;
			if (isExternal) BrowserUtils.clearAuthCookies();
		});
	}

	public getWaitingList(meetingId: string): Promise<GetWaitingListResponse> {
		return fetchAPI(`meetings/${meetingId}/queue`, RequestType.GET).then((resp) => {
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
		return fetchAPI(`meetings/${meetingId}/queue/${userId}`, RequestType.POST, {
			status
		});
	}

	public startRecording(meetingId: string, folderId: string): Promise<StartRecordingResponse> {
		return fetchAPI(`meetings/${meetingId}/startRecording`, RequestType.POST, {
			folderId
		});
	}

	public stopRecording(meetingId: string): Promise<StopRecordingResponse> {
		const version = useStore.getState().session?.apiVersion;
		// DEPRECATED: This check exists for backward compatibility with previous versions.
		//  * Remove once support for v1.6.3 is officially dropped.
		const params =
			!version || lte(version, '1.6.3')
				? {
						name: `Rec_${formatDate(new Date(), 'YYYY-MM-DD HHmm')}`,
						folderId: 'LOCAL_ROOT'
					}
				: undefined;
		return fetchAPI(`meetings/${meetingId}/stopRecording`, RequestType.POST, params);
	}

	public raiseHand(
		meetingId: string,
		value: boolean,
		userToModerate?: string
	): Promise<RaiseHandResponse> {
		return fetchAPI(`meetings/${meetingId}/hand`, RequestType.PUT, {
			raised: value,
			userToModerate
		});
	}

	public getLoginConfig(): Promise<LoginV3ConfigResponse> {
		return fetch('/zx/login/v3/config', { method: RequestType.GET })
			.then((resp) => {
				if (resp.ok) return resp;
				return Promise.reject(new Error(`${resp.status}`));
			})
			.then((resp) => resp.json())
			.catch((err: Error) => Promise.reject(err));
	}

	public createGuestAccount(name: string): Promise<CreateGuestAccountResponse> {
		// DEPRECATED: This check exists for backward compatibility with previous versions.
		//  * Remove once support for v1.6.4 is officially dropped.
		const version = useStore.getState().session?.apiVersion;
		if (!version || lte(version, '1.6.4')) {
			const headers = new Headers();
			headers.append('Content-Type', 'application/json');
			return fetch(`/zx/auth/v3/guests?name=${name}`, {
				method: RequestType.POST,
				headers
			})
				.then((resp) => {
					if (resp.ok) return resp;
					return Promise.reject(new Error(`${resp.status}`));
				})
				.then((res) => res.text())
				.then((res) => JSON.parse(res))
				.catch((err: Error) => Promise.reject(err));
		}
		return fetchAPI(`guests`, RequestType.POST, {
			name
		});
	}
}

export default MeetingsApi.getInstance();
