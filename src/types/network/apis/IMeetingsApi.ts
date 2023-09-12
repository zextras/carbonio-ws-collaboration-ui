/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { STREAM_TYPE } from '../../store/ActiveMeetingTypes';
import { JoinSettings, MeetingUser } from '../models/meetingBeTypes';
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
	joinMeeting(
		meetingId: string,
		settings: JoinSettings,
		devicesId: { audioDevice?: string; videoDevice?: string }
	): Promise<JoinMeetingResponse>;
	enterMeeting(
		roomId: string,
		settings: JoinSettings,
		devicesId: { audioDevice?: string; videoDevice?: string }
	): Promise<string>;
	leaveMeeting(meetingId: string): Promise<LeaveMeetingResponse>;
	// Stop meeting when all the users have left the meeting
	stopMeeting(meetingId: string): Promise<StopMeetingResponse>;
	// Delete meeting with the deletion of the room
	deleteMeeting(meetingId: string): Promise<DeleteMeetingResponse>;
	// Update user stream status
	createAudioOffer(meetingId: string, sdpOffer: string): Promise<CreateAudioOfferResponse>;
	updateAudioStreamStatus(
		meetingId: string,
		enabled: boolean
	): Promise<UpdateAudioStreamStatusResponse>;
	updateMediaOffer(
		meetingId: string,
		type: STREAM_TYPE,
		enabled: boolean,
		sdp?: string
	): Promise<UpdateMediaOfferResponse>;
	subscribeToMedia(
		meetingId: string,
		subscription: { user_id: string; type: STREAM_TYPE }[],
		unsubscription: { user_id: string; type: STREAM_TYPE }[]
	): Promise<SubscribeMediaResponse>;
	createMediaAnswer(meetingId: string, sdpOffer: string): Promise<CreateMediaAnswerResponse>;
}

export default IMeetingsApi;
