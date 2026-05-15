/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { JoinSettings, MeetingBe, MeetingType } from '../models/meetingBeTypes';
import { STREAM_TYPE, Subscription } from '../../store/ActiveMeetingTypes';

export type LoginV3ConfigResponse = Response & {
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
	zimbraPublicServiceProtocol: string;
	zimbraPublicServicePort: string;
	carbonioWebUiAppLogo?: string;
};

export type GuestAccount = {
	id: string;
	zmToken: string;
	zxToken: string;
};

export type JoinMeetingResult = { status: 'ACCEPTED' | 'WAITING' };

export type WaitingListResult = { users: string[] };

export interface IMeetingsApi {
	listMeetings(): Promise<MeetingBe[]>;
	createMeeting(
		roomId: string,
		meetingType: MeetingType,
		name: string,
		expiration?: string
	): Promise<MeetingBe>;
	getMeeting(roomId: string): Promise<MeetingBe>;
	getMeetingByMeetingId(meetingId: string): Promise<MeetingBe>;
	startMeeting(meetingId: string): Promise<MeetingBe>;
	getWaitingList(meetingId: string): Promise<WaitingListResult>;
	joinMeeting(
		meetingId: string,
		settings: JoinSettings,
		devicesId: { audioDevice?: string; videoDevice?: string }
	): Promise<JoinMeetingResult>;
	enterMeeting(
		roomId: string,
		settings: JoinSettings,
		devicesId: { audioDevice?: string; videoDevice?: string }
	): Promise<string>;
	leaveMeeting(meetingId: string): Promise<Response>;
	stopMeeting(meetingId: string): Promise<Response>;
	declineMeeting(meetingId: string): Promise<Response>;
	deleteMeeting(meetingId: string): Promise<Response>;
	createAudioOffer(meetingId: string, sdpOffer: string): Promise<Response>;
	updateAudioStreamStatus(
		meetingId: string,
		enabled: boolean,
		userToModerate?: string
	): Promise<Response>;
	updateMediaOffer(
		meetingId: string,
		type: STREAM_TYPE,
		enabled: boolean,
		sdp?: string
	): Promise<Response>;
	subscribeToMedia(
		meetingId: string,
		subscription: Subscription[],
		unsubscription: Subscription[]
	): Promise<Response>;
	createMediaAnswer(meetingId: string, sdpAnswer: string): Promise<Response>;
	getScheduledMeetingName(meetingId: string): Promise<{ name: string }>;
	leaveWaitingRoom(meetingId: string): Promise<Response>;
	acceptWaitingUser(meetingId: string, userId: string, accept: boolean): Promise<Response>;
	startRecording(meetingId: string, folderId: string): Promise<Response>;
	stopRecording(meetingId: string): Promise<Response>;
	raiseHand(meetingId: string, value: boolean, userToModerate?: string): Promise<Response>;
	createGuestAccount(name: string): Promise<GuestAccount>;
	getLoginConfig(): Promise<LoginV3ConfigResponse>;
}
