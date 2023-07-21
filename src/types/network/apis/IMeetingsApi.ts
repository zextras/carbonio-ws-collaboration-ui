/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { JoinSettings, MeetingUser } from '../models/meetingBeTypes';
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
} from '../responses/meetingsResponses';

interface IMeetingsApi {
	listMeetings(): Promise<ListMeetingsResponse>;
	// Create meeting with the creation of the room
	createPermanentMeeting(roomId: string): Promise<CreateMeetingResponse>;
	createScheduledMeeting(
		name: string,
		users: MeetingUser[],
		roomId: string,
		expiration?: number
	): Promise<CreateMeetingResponse>;
	getMeeting(roomId: string): Promise<GetMeetingResponse>;
	getMeetingByMeetingId(meetingId: string): Promise<GetMeetingResponse>;
	// Start meeting when the created meeting is not active (no one is inside)
	startMeeting(meetingId: string): Promise<StartMeetingResponse>;
	// Join meeting when someone has already started the meeting
	joinMeeting(roomId: string, settings: JoinSettings): Promise<JoinMeetingResponse>;
	joinMeetingByRoomId(roomId: string, settings: JoinSettings): Promise<JoinMeetingResponse>;
	leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse>;
	// Stop meeting when all the users have left the meeting
	stopMeeting(meetingId: string): Promise<StopMeetingResponse>;
	// Delete meeting with the deletion of the room
	deleteMeeting(meetingId: string): Promise<DeleteMeetingResponse>;
	// Update user stream status
	updateAudioStreamStatus(
		meetingId: string,
		enabled: boolean
	): Promise<UpdateAudioStreamStatusResponse>;
	updateVideoStreamStatus(
		meetingId: string,
		enabled: boolean
	): Promise<UpdateVideoStreamStatusResponse>;
	updateScreenStreamStatus(
		meetingId: string,
		enabled: boolean
	): Promise<UpdateScreenStreamStatusResponse>;
	createAudioOffer(
		meetingId: string,
		sdpOffer: RTCSessionDescriptionInit
	): Promise<CreateAudioOfferResponse>;
	createVideoOffer(
		meetingId: string,
		sdpOffer: RTCSessionDescriptionInit
	): Promise<CreateVideoOfferResponse>;
}

export default IMeetingsApi;
