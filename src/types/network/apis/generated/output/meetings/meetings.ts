/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
/**
 * Zextras Carbonio Workstream Collaboration API
 * Zextras Carbonio Workstream Collaboration HTTP APIs definition.
 * OpenAPI spec version: 1.6.0
 */
import type {
	CreateMeetingRequestBody,
	JoinMeetingRequestBody,
	N200CreateMeetingResponse,
	N200GetMeetingResponse,
	N200GetPublicMeetingResponse,
	N200GetRoomMeetingResponse,
	N200JoinMeetingResponse,
	N200ListMeetingResponse,
	N200QueueResponse,
	N200StartMeetingResponse,
	N200StopMeetingResponse,
	N204AnswerMediaStreamResponse,
	N204AudioStreamResponse,
	N204DeleteMeetingResponse,
	N204HandStatusResponse,
	N204LeaveMeetingResponse,
	N204MediaStreamResponse,
	N204OfferAudioStreamResponse,
	N204StartMeetingRecordingResponse,
	N204StopMeetingRecordingResponse,
	N204SubscribeMediaStreamResponse,
	N204UpdateQueuedUserResponse,
	RtcMediaStreamRequestBody,
	StopMeetingRecordingRequestBody,
	UpdateAudioStreamRequestBody,
	UpdateHandStatusRequestBody,
	UpdateMediaStreamRequestBody,
	UpdateMediaStreamSubscriptionsRequestBody,
	UpdateQueuedUserRequestBody
} from '../api.schemas';

/**
 * @summary Retrieves the meeting associated with the requested room
 */
export const getGetMeetingByRoomIdUrl = (roomId: string) => `/rooms/${roomId}/meeting`;

export const getMeetingByRoomId = async (
	roomId: string,
	options?: RequestInit
): Promise<N200GetRoomMeetingResponse> => {
	const res = await fetch(getGetMeetingByRoomIdUrl(roomId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetRoomMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves public data of the meeting
 */
export const getGetMeetingPublicUrl = (meetingId: string) => `/public/meetings/${meetingId}`;

export const getMeetingPublic = async (
	meetingId: string,
	options?: RequestInit
): Promise<N200GetPublicMeetingResponse> => {
	const res = await fetch(getGetMeetingPublicUrl(meetingId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetPublicMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves a list of every meeting the user has access to
 */
export const getListMeetingUrl = () => `/meetings`;

export const listMeeting = async (options?: RequestInit): Promise<N200ListMeetingResponse> => {
	const res = await fetch(getListMeetingUrl(), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200ListMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Creates a new meeting
 */
export const getCreateMeetingUrl = () => `/meetings`;

export const createMeeting = async (
	createMeetingRequestBody: CreateMeetingRequestBody,
	options?: RequestInit
): Promise<N200CreateMeetingResponse> => {
	const res = await fetch(getCreateMeetingUrl(), {
		...options,
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(createMeetingRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200CreateMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves the requested meeting
 */
export const getGetMeetingUrl = (meetingId: string) => `/meetings/${meetingId}`;

export const getMeeting = async (
	meetingId: string,
	options?: RequestInit
): Promise<N200GetMeetingResponse> => {
	const res = await fetch(getGetMeetingUrl(meetingId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Deletes the requested meeting
 */
export const getDeleteMeetingUrl = (meetingId: string) => `/meetings/${meetingId}`;

export const deleteMeeting = async (
	meetingId: string,
	options?: RequestInit
): Promise<N204DeleteMeetingResponse> => {
	const res = await fetch(getDeleteMeetingUrl(meetingId), {
		...options,
		method: 'DELETE'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204DeleteMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Starts the current meeting
 */
export const getStartMeetingUrl = (meetingId: string) => `/meetings/${meetingId}/start`;

export const startMeeting = async (
	meetingId: string,
	options?: RequestInit
): Promise<N200StartMeetingResponse> => {
	const res = await fetch(getStartMeetingUrl(meetingId), {
		...options,
		method: 'POST'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200StartMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Stops the current meeting
 */
export const getStopMeetingUrl = (meetingId: string) => `/meetings/${meetingId}/stop`;

export const stopMeeting = async (
	meetingId: string,
	options?: RequestInit
): Promise<N200StopMeetingResponse> => {
	const res = await fetch(getStopMeetingUrl(meetingId), {
		...options,
		method: 'POST'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200StopMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Adds the current user to the specified meeting
 */
export const getJoinMeetingUrl = (meetingId: string) => `/meetings/${meetingId}/join`;

export const joinMeeting = async (
	meetingId: string,
	joinMeetingRequestBody: JoinMeetingRequestBody,
	options?: RequestInit
): Promise<N200JoinMeetingResponse> => {
	const res = await fetch(getJoinMeetingUrl(meetingId), {
		...options,
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(joinMeetingRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200JoinMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Remove the current user to the specified meeting
 */
export const getLeaveMeetingUrl = (meetingId: string) => `/meetings/${meetingId}/leave`;

export const leaveMeeting = async (
	meetingId: string,
	options?: RequestInit
): Promise<N204LeaveMeetingResponse> => {
	const res = await fetch(getLeaveMeetingUrl(meetingId), {
		...options,
		method: 'POST'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204LeaveMeetingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieve the list of people in queue for the meeting
 */
export const getGetQueueUrl = (meetingId: string) => `/meetings/${meetingId}/queue`;

export const getQueue = async (
	meetingId: string,
	options?: RequestInit
): Promise<N200QueueResponse> => {
	const res = await fetch(getGetQueueUrl(meetingId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200QueueResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Updates the status of a queued user
 */
export const getUpdateQueuedUserUrl = (meetingId: string, userId: string) =>
	`/meetings/${meetingId}/queue/${userId}`;

export const updateQueuedUser = async (
	meetingId: string,
	userId: string,
	updateQueuedUserRequestBody: UpdateQueuedUserRequestBody,
	options?: RequestInit
): Promise<N204UpdateQueuedUserResponse> => {
	const res = await fetch(getUpdateQueuedUserUrl(meetingId, userId), {
		...options,
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(updateQueuedUserRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204UpdateQueuedUserResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Update media stream status for the current session
 */
export const getUpdateMediaStreamUrl = (meetingId: string) => `/meetings/${meetingId}/media`;

export const updateMediaStream = async (
	meetingId: string,
	updateMediaStreamRequestBody: UpdateMediaStreamRequestBody,
	options?: RequestInit
): Promise<N204MediaStreamResponse> => {
	const res = await fetch(getUpdateMediaStreamUrl(meetingId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(updateMediaStreamRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204MediaStreamResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Complete WebRTC negotiation for media streams for the current session
 */
export const getAnswerRtcMediaStreamUrl = (meetingId: string) =>
	`/meetings/${meetingId}/media/answer`;

export const answerRtcMediaStream = async (
	meetingId: string,
	rtcMediaStreamRequestBody: RtcMediaStreamRequestBody,
	options?: RequestInit
): Promise<N204AnswerMediaStreamResponse> => {
	const res = await fetch(getAnswerRtcMediaStreamUrl(meetingId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(rtcMediaStreamRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204AnswerMediaStreamResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Update subscriptions of the current session to the desired media streams
 */
export const getUpdateSubscriptionsMediaStreamUrl = (meetingId: string) =>
	`/meetings/${meetingId}/media/subscribe`;

export const updateSubscriptionsMediaStream = async (
	meetingId: string,
	updateMediaStreamSubscriptionsRequestBody: UpdateMediaStreamSubscriptionsRequestBody,
	options?: RequestInit
): Promise<N204SubscribeMediaStreamResponse> => {
	const res = await fetch(getUpdateSubscriptionsMediaStreamUrl(meetingId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(updateMediaStreamSubscriptionsRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204SubscribeMediaStreamResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Update audio stream status for a user, a moderator can disable audio for another user
 */
export const getUpdateAudioStreamUrl = (meetingId: string) => `/meetings/${meetingId}/audio`;

export const updateAudioStream = async (
	meetingId: string,
	updateAudioStreamRequestBody: UpdateAudioStreamRequestBody,
	options?: RequestInit
): Promise<N204AudioStreamResponse> => {
	const res = await fetch(getUpdateAudioStreamUrl(meetingId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(updateAudioStreamRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204AudioStreamResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Start WebRTC negotiation for audio stream for the current session
 */
export const getOfferRtcAudioStreamUrl = (meetingId: string) =>
	`/meetings/${meetingId}/audio/offer`;

export const offerRtcAudioStream = async (
	meetingId: string,
	rtcMediaStreamRequestBody: RtcMediaStreamRequestBody,
	options?: RequestInit
): Promise<N204OfferAudioStreamResponse> => {
	const res = await fetch(getOfferRtcAudioStreamUrl(meetingId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(rtcMediaStreamRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204OfferAudioStreamResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Start recording on the specified meeting
 */
export const getStartRecordingUrl = (meetingId: string) => `/meetings/${meetingId}/startRecording`;

export const startRecording = async (
	meetingId: string,
	options?: RequestInit
): Promise<N204StartMeetingRecordingResponse> => {
	const res = await fetch(getStartRecordingUrl(meetingId), {
		...options,
		method: 'POST'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204StartMeetingRecordingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Stop recording on the specified meeting
 */
export const getStopRecordingUrl = (meetingId: string) => `/meetings/${meetingId}/stopRecording`;

export const stopRecording = async (
	meetingId: string,
	stopMeetingRecordingRequestBody: StopMeetingRecordingRequestBody,
	options?: RequestInit
): Promise<N204StopMeetingRecordingResponse> => {
	const res = await fetch(getStopRecordingUrl(meetingId), {
		...options,
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(stopMeetingRecordingRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204StopMeetingRecordingResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Update hand status for a user during a meeting, a moderator can lower down the hand for another user
 */
export const getUpdateHandStatusUrl = (meetingId: string) => `/meetings/${meetingId}/hand`;

export const updateHandStatus = async (
	meetingId: string,
	updateHandStatusRequestBody: UpdateHandStatusRequestBody,
	options?: RequestInit
): Promise<N204HandStatusResponse> => {
	const res = await fetch(getUpdateHandStatusUrl(meetingId), {
		...options,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		body: JSON.stringify(updateHandStatusRequestBody)
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204HandStatusResponse = body ? JSON.parse(body) : {};

	return data;
};
