/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import attachmentsApi from '../../network/apis/AttachmentsApi';
import meetingsApi from '../../network/apis/MeetingsApi';
import roomsApi from '../../network/apis/RoomsApi';
import usersApi from '../../network/apis/UsersApi';

export enum RoomsApiToSpy {
	GET_ROOM = 'getRoom',
	ADD_ROOM = 'addRoom',
	DELETE_ROOM = 'deleteRoom',
	UPDATE_ROOM = 'updateRoom',
	ADD_ROOM_MEMBER = 'addRoomMember',
	DELETE_ROOM_MEMBER = 'deleteRoomMember',
	PROMOTE_ROOM_MEMBER = 'promoteRoomMember',
	DEMOTE_ROOM_MEMBER = 'demotesRoomMember',
	UPDATE_ROOM_PICTURE = 'updateRoomPicture',
	DELETE_ROOM_PICTURE = 'deleteRoomPicture',
	MUTE_ROOM_NOTIFICATION = 'muteRoomNotification',
	UNMUTE_ROOM_NOTIFICATION = 'unmuteRoomNotification',
	CLEAR_ROOM_HISTORY = 'clearRoomHistory',
	FORWARD_MESSAGE = 'forwardMessages',
	ADD_ROOM_ATTACHMENT = 'addRoomAttachment'
}

export enum AttachmentsApiToSpy {
	GET_IMAGE_SIZE = 'getImageSize',
	GET_URL_ATTACHMENT = 'getURLAttachment',
	DELETE_ATTACHMENT = 'deleteAttachment',
	GET_IMAGE_THUMBNAIL_URL = 'getImageThumbnailURL'
}

export enum UsersApiToSpy {
	GET_URL_USER_PICTURE = 'getURLUserPicture'
}

export enum MeetingsApiToSpy {
	CREATE_MEETING = 'createMeeting',
	GET_MEETING = 'getMeeting',
	LEAVE_MEETING = 'leaveMeeting',
	ENTER_MEETING = 'enterMeeting',
	JOIN_MEETING = 'joinMeeting',
	LEAVE_WAITING_ROOM = 'leaveWaitingRoom',
	GET_MEETING_BY_MEETING_ID = 'getMeetingByMeetingId',
	GET_SCHEDULED_MEETING_NAME = 'getScheduledMeetingName',
	UPDATE_AUDIO_STREAM_STATUS = 'updateAudioStreamStatus',
	START_RECORDING = 'startRecording',
	STOP_RECORDING = 'stopRecording',
	ACCEPT_WAITING_USER = 'acceptWaitingUser',
	AUTH_LOGIN = 'authLogin',
	CREATE_GUEST_ACCOUNT = 'createGuestAccount'
}

export const spyOnAttachmentsApi: (apiToSpy: AttachmentsApiToSpy) => jest.SpyInstance = (
	apiToSpy: AttachmentsApiToSpy
) => jest.spyOn(attachmentsApi, apiToSpy);
export const spyOnRoomsApi: (apiToSpy: RoomsApiToSpy) => jest.SpyInstance = (
	apiToSpy: RoomsApiToSpy
) => jest.spyOn(roomsApi, apiToSpy);
export const spyOnUsersApi: (apiToSpy: UsersApiToSpy) => jest.SpyInstance = (
	apiToSpy: UsersApiToSpy
) => jest.spyOn(usersApi, apiToSpy);
export const spyOnMeetingsApi: (apiToSpy: MeetingsApiToSpy) => jest.SpyInstance = (
	apiToSpy: MeetingsApiToSpy
) => jest.spyOn(meetingsApi, apiToSpy);
