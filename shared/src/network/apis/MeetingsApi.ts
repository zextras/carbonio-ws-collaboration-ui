/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { chain, find } from 'lodash';
import { lte } from 'semver';

import { deleteRoomMember } from './RoomsApi';
import { sharedConfig } from '../../config';
import { RequestType } from '../../types/network/fetch';
import {
	CreateMeetingData,
	JoinSettings,
	MeetingBe,
	MeetingType
} from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE, Subscription } from '../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { UserType } from '../../types/store/UserTypes';
import { dateToTimestamp, formatDate } from '../../utils/dateUtils';
import { PeerConnConfig } from '../webRTC/PeerConnConfig';

export const listMeetings = (): Promise<MeetingBe[]> =>
	sharedConfig.fetchAPI<MeetingBe[]>(`meetings`, RequestType.GET).then((resp) => {
		sharedConfig.useStore.getState().addMeetings(resp);
		return resp;
	});

export const createMeeting = (
	roomId: string,
	meetingType: MeetingType,
	name: string,
	expiration?: string
): Promise<MeetingBe> => {
	const createMeetingData: CreateMeetingData = { roomId, meetingType, name, expiration };
	return sharedConfig.fetchAPI(`meetings`, RequestType.POST, createMeetingData);
};

export const getMeeting = (roomId: string): Promise<MeetingBe> =>
	sharedConfig.fetchAPI(`rooms/${roomId}/meeting`, RequestType.GET);

export const getMeetingByMeetingId = (meetingId: string): Promise<MeetingBe> =>
	sharedConfig.fetchAPI<MeetingBe>(`meetings/${meetingId}`, RequestType.GET).then((resp) => {
		sharedConfig.useStore.getState().addMeetings([resp]);
		return resp;
	});

export const startMeeting = (meetingId: string): Promise<MeetingBe> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/start`, RequestType.POST);

export const getWaitingList = (meetingId: string): Promise<{ users: string[] }> =>
	sharedConfig
		.fetchAPI<{ users: string[] }>(`meetings/${meetingId}/queue`, RequestType.GET)
		.then((resp) => {
			sharedConfig.useStore.getState().setWaitingList(meetingId, resp.users);
			return resp;
		});

type TurnCredentialsResponse = {
	url: string;
	username: string;
	credential: string;
	ttl: number;
};
export function fetchTurnIceServers(meetingId: string): Promise<RTCIceServer[]> {
	return sharedConfig
		.fetchAPI<TurnCredentialsResponse>(`meetings/${meetingId}/turnCredentials`, RequestType.GET)
		.then((data) => {
			// fetchAPI resolves with parsed JSON when Content-Type is application/json.
			// If TURN is not configured the server returns 204 (no body, no JSON content-type),
			// in which case handleResponse returns the raw Response object — treat that as no TURN.
			if (!data || data instanceof Response) {
				return [];
			}
			return [
				{
					urls: data.url,
					username: data.username,
					credential: data.credential
				}
			];
		})
		.catch(() => []);
}

export const joinMeeting = (
	meetingId: string,
	settings: JoinSettings,
	devicesId: { audioDevice?: string; videoDevice?: string }
): Promise<{ status: 'ACCEPTED' | 'WAITING' }> =>
	sharedConfig
		.fetchAPI<{
			status: 'ACCEPTED' | 'WAITING';
		}>(`meetings/${meetingId}/join`, RequestType.POST, settings)
		.then((resp) => {
			if (resp.status === 'ACCEPTED') {
				return fetchTurnIceServers(meetingId).then((turnServers) => {
					PeerConnConfig.setTurnServers(turnServers);
					sharedConfig.useStore
						.getState()
						.meetingConnection(
							meetingId,
							{ enabled: settings.audioStreamEnabled, deviceId: devicesId.audioDevice },
							{ enabled: settings.videoStreamEnabled, deviceId: devicesId.videoDevice }
						);
					return getMeetingByMeetingId(meetingId).then((meeting) => {
						if (meeting.meetingType === MeetingType.SCHEDULED) {
							const room = find(
								sharedConfig.useStore.getState().rooms,
								(room) => room.meetingId === meetingId
							);
							const iAmOwner = find(
								room?.members,
								(member) =>
									member.userId === sharedConfig.useStore.getState().session.id && member.owner
							);
							if (iAmOwner) getWaitingList(meetingId);
						}
						chain(meeting.participants)
							.filter((p) => p.handRaisedAt !== undefined)
							.sortBy((p) => dateToTimestamp(new Date(p.handRaisedAt ?? new Date())))
							.each((participant) => {
								sharedConfig.useStore.getState().setUserWithHandRaised(participant.userId, true);
							})
							.value();
						return resp;
					});
				});
			}
			return resp;
		});

export const enterMeeting = (
	roomId: string,
	settings: JoinSettings,
	devicesId: { audioDevice?: string; videoDevice?: string }
): Promise<string> => {
	const meeting = find(
		sharedConfig.useStore.getState().meetings,
		(meeting) => meeting.roomId === roomId
	);
	if (meeting) {
		if (meeting.active) {
			return joinMeeting(meeting.id, settings, devicesId).then(() => meeting.id);
		}
		return startMeeting(meeting.id).then(() =>
			joinMeeting(meeting.id, settings, devicesId).then(() => meeting.id)
		);
	}
	const roomName = sharedConfig.useStore.getState().rooms[roomId]?.name ?? '';
	return createMeeting(roomId, MeetingType.PERMANENT, roomName).then((response) =>
		startMeeting(response.id).then(() =>
			joinMeeting(response.id, settings, devicesId).then(() => response.id)
		)
	);
};

export const leaveMeeting = (meetingId: string): Promise<Response> => {
	const room = find(sharedConfig.useStore.getState().rooms, (room) => room.meetingId === meetingId);
	const iAmNotOwner = find(
		room?.members,
		(member) => member.userId === sharedConfig.useStore.getState().session.id && !member.owner
	);
	const isExternal = sharedConfig.useStore.getState().session?.userType === UserType.GUEST;
	return sharedConfig
		.fetchAPI<Response>(`meetings/${meetingId}/leave`, RequestType.POST)
		.then((resp) => {
			sharedConfig.useStore.getState().meetingDisconnection(meetingId);
			// DEPRECATED: This function exists for backward compatibility with previous versions.
			//  * Remove once support for v1.6.2 is officially dropped.
			const version = sharedConfig.useStore.getState().session.apiVersion;
			if ((!version || lte(version, '1.6.2')) && room?.type === RoomType.TEMPORARY && iAmNotOwner) {
				deleteRoomMember(room.id, sharedConfig.useStore.getState().session.id ?? '');
			}
			if (isExternal) sharedConfig.clearAuthCookies();
			return resp;
		})
		.catch((err) => {
			if (isExternal) sharedConfig.clearAuthCookies();
			return err;
		});
};

export const stopMeeting = (meetingId: string): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/stop`, RequestType.POST);

export const declineMeeting = (meetingId: string): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/decline`, RequestType.POST);

export const deleteMeeting = (meetingId: string): Promise<Response> =>
	sharedConfig.fetchAPI<Response>(`meetings/${meetingId}`, RequestType.DELETE).then((resp) => {
		sharedConfig.useStore.getState().meetingDisconnection(meetingId);
		return resp;
	});

export const createAudioOffer = (meetingId: string, sdpOffer: string): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/audio/offer`, RequestType.PUT, { sdp: sdpOffer });

export const updateAudioStreamStatus = (
	meetingId: string,
	enabled: boolean,
	userToModerate?: string
): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/audio`, RequestType.PUT, {
		enabled,
		userToModerate
	});

export const updateMediaOffer = (
	meetingId: string,
	type: STREAM_TYPE,
	enabled: boolean,
	sdp?: string
): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/media`, RequestType.PUT, { type, enabled, sdp });

export const subscribeToMedia = (
	meetingId: string,
	subscription: Subscription[],
	unsubscription: Subscription[]
): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/media/subscribe`, RequestType.PUT, {
		subscribe: subscription,
		unsubscribe: unsubscription
	});

export const createMediaAnswer = (meetingId: string, sdpAnswer: string): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/media/answer`, RequestType.PUT, { sdp: sdpAnswer });

export const getScheduledMeetingName = (meetingId: string): Promise<{ name: string }> =>
	sharedConfig.fetchAPI(`public/meetings/${meetingId}`, RequestType.GET);

export const leaveWaitingRoom = (meetingId: string): Promise<Response> => {
	const userId = sharedConfig.useStore.getState().session.id;
	return sharedConfig
		.fetchAPI<Response>(`meetings/${meetingId}/queue/${userId}`, RequestType.POST, {
			status: 'REJECTED'
		})
		.finally(() => {
			const isExternal = sharedConfig.useStore.getState().session?.userType === UserType.GUEST;
			if (isExternal) sharedConfig.clearAuthCookies();
		});
};

export const acceptWaitingUser = (
	meetingId: string,
	userId: string,
	accept: boolean
): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/queue/${userId}`, RequestType.POST, {
		status: accept ? 'ACCEPTED' : 'REJECTED'
	});

export const startRecording = (meetingId: string, folderId: string): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/startRecording`, RequestType.POST, { folderId });

export const stopRecording = (meetingId: string): Promise<Response> => {
	const version = sharedConfig.useStore.getState().session?.apiVersion;
	// DEPRECATED: This check exists for backward compatibility with previous versions.
	//  * Remove once support for v1.6.3 is officially dropped.
	const params =
		!version || lte(version, '1.6.3')
			? { name: `Rec_${formatDate(new Date(), 'YYYY-MM-DD HHmm')}`, folderId: 'LOCAL_ROOT' }
			: undefined;
	return sharedConfig.fetchAPI(`meetings/${meetingId}/stopRecording`, RequestType.POST, params);
};

export const raiseHand = (
	meetingId: string,
	value: boolean,
	userToModerate?: string
): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/hand`, RequestType.PUT, {
		raised: value,
		userToModerate
	});

export const createGuestAccount = (
	name: string
): Promise<{
	id: string;
	zmToken: string;
	zxToken: string;
}> => {
	// DEPRECATED: This check exists for backward compatibility with previous versions.
	//  * Remove once support for v1.6.4 is officially dropped.
	const version = sharedConfig.useStore.getState().session?.apiVersion;
	if (!version || lte(version, '1.6.4')) {
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		return fetch(`/zx/auth/v3/guests?name=${name}`, { method: RequestType.POST, headers })
			.then((resp) => {
				if (resp.ok) return resp;
				return Promise.reject(new Error(`${resp.status}`));
			})
			.then((res) => res.text())
			.then((res) => JSON.parse(res))
			.catch((err: Error) => Promise.reject(err));
	}
	return sharedConfig.fetchAPI(`guests`, RequestType.POST, { name });
};

type LoginV3ConfigResponse = Response & {
	carbonioAdminUiDescription: string;
	carbonioAdminUiTitle: string;
	carbonioFeatureResetPasswordEnabled: boolean;
	carbonioLogoURL: string;
	carbonioPrefWebUiDarkMode: boolean;
	carbonioWebUiDarkMode: boolean;
	carbonioWebUiDescription: string;
	carbonioWebUiTitle: string;
	publicUrl: string;
	zimbraDomainName: string;
	zimbraPublicServiceHostname: string;
	zimbraPublicServicePort: string;
	zimbraPublicServiceProtocol: string;
	carbonioWebUiAppLogo?: string;
};
export const getLoginConfig = (): Promise<LoginV3ConfigResponse> =>
	fetch('/zx/login/v3/config', { method: RequestType.GET })
		.then((resp) => {
			if (resp.ok) return resp;
			throw new Error(`${resp.status}`);
		})
		.then((resp) => resp.json())
		.catch((err: Error) => console.error(err));

export const audioIceRestart = (meetingId: string, sdp: string): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/audio/iceRestart`, RequestType.PUT, { sdp });

export const videoIceRestart = (meetingId: string, sdp?: string): Promise<Response> => {
	const body = { ...(sdp && { sdp }) };
	return sharedConfig.fetchAPI(`meetings/${meetingId}/video/iceRestart`, RequestType.PUT, body);
};

export const screenIceRestart = (meetingId: string, sdp: string): Promise<Response> =>
	sharedConfig.fetchAPI(`meetings/${meetingId}/screen/iceRestart`, RequestType.PUT, { sdp });
