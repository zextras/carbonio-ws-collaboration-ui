/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { STREAM_TYPE, Subscription } from '../../store/ActiveMeetingTypes';
import { JoinSettings, MeetingType } from '../models/meetingBeTypes';
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
} from '../responses/meetingsResponses';

interface IMeetingsApi {
	listMeetings(): Promise<ListMeetingsResponse>;
	// Create meeting with the creation of the room
	createMeeting(
		roomId: string,
		meetingType: MeetingType,
		name: string,
		expiration?: string
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
		enabled: boolean,
		userToModerate?: string
	): Promise<UpdateAudioStreamStatusResponse>;
	updateMediaOffer(
		meetingId: string,
		type: STREAM_TYPE,
		enabled: boolean,
		sdp?: string
	): Promise<UpdateMediaOfferResponse>;
	subscribeToMedia(
		meetingId: string,
		subscription: Subscription[],
		unsubscription: Subscription[]
	): Promise<SubscribeMediaResponse>;
	createMediaAnswer(meetingId: string, sdpOffer: string): Promise<CreateMediaAnswerResponse>;
	// Scheduled meetings
	getScheduledMeetingName(meetingId: string): Promise<GetScheduledMeetingNameResponse>;
	leaveWaitingRoom(meetingId: string): Promise<AcceptWaitingUserResponse>;
	getWaitingList(meetingId: string): Promise<GetWaitingListResponse>;
	acceptWaitingUser(
		meetingId: string,
		userId: string,
		accept: boolean
	): Promise<AcceptWaitingUserResponse>;
	startRecording(meetingId: string): Promise<StartRecordingResponse>;
	stopRecording(
		meetingId: string,
		recordingName: string,
		folderId: string
	): Promise<StopRecordingResponse>;
}

export default IMeetingsApi;
