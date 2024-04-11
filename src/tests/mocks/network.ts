/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GetImageResponse } from '../../types/network/responses/attachmentsResponses';
import {
	AcceptWaitingUserResponse,
	CreateMeetingResponse,
	DeleteMeetingResponse,
	GetMeetingResponse,
	JoinMeetingResponse,
	LeaveMeetingResponse,
	StartMeetingResponse,
	StartRecordingResponse,
	StopMeetingResponse,
	StopRecordingResponse,
	SubscribeMediaResponse,
	UpdateAudioStreamStatusResponse
} from '../../types/network/responses/meetingsResponses';
import {
	AddRoomMemberResponse,
	AddRoomResponse,
	ClearRoomHistoryResponse,
	DeleteRoomMemberResponse,
	DeleteRoomPictureResponse,
	DeleteRoomResponse,
	DemotesRoomMemberResponse,
	ForwardMessagesResponse,
	GetRoomResponse,
	MuteRoomResponse,
	PromoteRoomMemberResponse,
	UnmuteRoomResponse,
	UpdateRoomPictureResponse,
	UpdateRoomResponse,
	AddRoomAttachmentResponse
} from '../../types/network/responses/roomsResponses';
import {
	GetUserPictureResponse,
	GetUserResponse
} from '../../types/network/responses/usersResponses';

export const mockedAddRoomRequest: jest.Mock = jest.fn();
export const mockedGetRoomRequest: jest.Mock = jest.fn();
export const mockedDeleteRoomRequest: jest.Mock = jest.fn();
export const mockedClearHistoryRequest: jest.Mock = jest.fn();
export const mockedUpdateRoomPictureRequest: jest.Mock = jest.fn();
export const mockedDeleteRoomPictureRequest: jest.Mock = jest.fn();
export const mockedMuteRoomNotificationRequest: jest.Mock = jest.fn();
export const mockedUnmuteRoomNotificationRequest: jest.Mock = jest.fn();
export const mockedUpdateRoomRequest: jest.Mock = jest.fn();
export const mockedGetUserRequest: jest.Mock = jest.fn();
export const mockedGetUserPictureRequest: jest.Mock = jest.fn();
export const mockedGetURLUserPicture: jest.Mock = jest.fn(() => 'image.jpeg');
export const mockedGetDebouncedUserRequest: jest.Mock = jest.fn();
export const mockedGetURLAttachment: jest.Mock = jest.fn();
export const mockedGetImageURL: jest.Mock = jest.fn();
export const mockedGetImageThumbnailURL: jest.Mock = jest.fn();
export const mockedGetPdfURL: jest.Mock = jest.fn();
export const mockedGetPdfThumbnailURL: jest.Mock = jest.fn();
export const mockedDeleteRoomMemberRequest: jest.Mock = jest.fn();
export const mockedPromoteRoomMemberRequest: jest.Mock = jest.fn();
export const mockedDemotesRoomMemberRequest: jest.Mock = jest.fn();
export const mockedAddRoomMemberRequest: jest.Mock = jest.fn();
export const mockedForwardMessagesRequest: jest.Mock = jest.fn();
export const mockedGetMeetingRequest: jest.Mock = jest.fn();
export const mockedCreateMeetingRequest: jest.Mock = jest.fn();
export const mockedStartMeetingRequest: jest.Mock = jest.fn();
export const mockedJoinMeetingRequest: jest.Mock = jest.fn();
export const mockedEnterMeetingRequest: jest.Mock = jest.fn();
export const mockedLeaveMeetingRequest: jest.Mock = jest.fn();
export const mockedStopMeetingRequest: jest.Mock = jest.fn();
export const mockedDeleteMeetingRequest: jest.Mock = jest.fn();
export const mockedAddRoomAttachmentRequest: jest.Mock = jest.fn();
export const mockedUpdateAudioStreamStatusRequest: jest.Mock = jest.fn();
export const mockedSubscribeToMediaRequest: jest.Mock = jest.fn();
export const mockedAcceptWaitingUserRequest: jest.Mock = jest.fn();
export const mockedGetScheduledMeetingName: jest.Mock = jest.fn();
export const mockedLeaveWaitingRoomRequest: jest.Mock = jest.fn();
export const mockedImageSizeRequest: jest.Mock = jest.fn();
export const mockedStartRecordingRequest: jest.Mock = jest.fn();
export const mockedStopRecordingRequest: jest.Mock = jest.fn();

jest.mock('../../network', () => {
	const noResultProvided = 'no result provided';
	return {
		RoomsApi: {
			addRoom: (): Promise<AddRoomResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedAddRoomRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			getRoom: (): Promise<GetRoomResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedGetRoomRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			deleteRoom: (): Promise<DeleteRoomResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedDeleteRoomRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			deleteRoomAndMeeting: (): Promise<DeleteRoomResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedDeleteRoomRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			clearRoomHistory: (): Promise<ClearRoomHistoryResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedClearHistoryRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			getURLRoomPicture: (): string => 'image.jpeg',
			updateRoomPicture: (): Promise<UpdateRoomPictureResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedUpdateRoomPictureRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			deleteRoomPicture: (): Promise<DeleteRoomPictureResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedDeleteRoomPictureRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			muteRoomNotification: (): Promise<MuteRoomResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedMuteRoomNotificationRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			unmuteRoomNotification: (): Promise<UnmuteRoomResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedUnmuteRoomNotificationRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			updateRoom: (): Promise<UpdateRoomResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedUpdateRoomRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			deleteRoomMember: (): Promise<DeleteRoomMemberResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedDeleteRoomMemberRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			promoteRoomMember: (): Promise<PromoteRoomMemberResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedPromoteRoomMemberRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			demotesRoomMember: (): Promise<DemotesRoomMemberResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedDemotesRoomMemberRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			addRoomMember: (): Promise<AddRoomMemberResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedAddRoomMemberRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			forwardMessages: (): Promise<ForwardMessagesResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedForwardMessagesRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			addRoomAttachment: (): Promise<AddRoomAttachmentResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedAddRoomAttachmentRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			replacePlaceholderRoom: (): Promise<AddRoomResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedAddRoomRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				})
		},
		UsersApi: {
			getUser: (): Promise<GetUserResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedGetUserRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			getUserPicture: (): Promise<GetUserPictureResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedGetUserPictureRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			getURLUserPicture: mockedGetURLUserPicture,
			getDebouncedUser: jest.fn()
		},
		AttachmentsApi: {
			getURLAttachment: mockedGetURLAttachment,
			getImagePreviewURL: mockedGetImageURL,
			getImageThumbnailURL: mockedGetImageThumbnailURL,
			getPdfPreviewURL: mockedGetPdfURL,
			getPdfThumbnailURL: mockedGetPdfThumbnailURL,
			getImageSize: (): Promise<GetImageResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedImageSizeRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				})
		},
		MeetingsApi: {
			getMeeting: (): Promise<GetMeetingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedGetMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			getMeetingByMeetingId: (): Promise<GetMeetingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedGetMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			createMeeting: (): Promise<CreateMeetingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedCreateMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			startMeeting: (): Promise<StartMeetingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedStartMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			joinMeeting: (): Promise<JoinMeetingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedJoinMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			enterMeeting: (): Promise<string> =>
				new Promise((resolve, reject) => {
					const result = mockedEnterMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			leaveMeeting: (): Promise<LeaveMeetingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedLeaveMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			stopMeeting: (): Promise<StopMeetingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedStopMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			deleteMeeting: (): Promise<DeleteMeetingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedDeleteMeetingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			updateAudioStreamStatus: (): Promise<UpdateAudioStreamStatusResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedUpdateAudioStreamStatusRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			subscribeToMedia: (): Promise<SubscribeMediaResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedSubscribeToMediaRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			acceptWaitingUser(
				meetingId: string,
				userId: string,
				accept: boolean
			): Promise<AcceptWaitingUserResponse> {
				return new Promise((resolve, reject) => {
					const result = mockedAcceptWaitingUserRequest(meetingId, userId, accept);
					result ? resolve(result) : reject(new Error(noResultProvided));
				});
			},
			getScheduledMeetingName: (): Promise<SubscribeMediaResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedGetScheduledMeetingName();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			leaveWaitingRoom: (): Promise<SubscribeMediaResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedLeaveWaitingRoomRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			startRecording: (): Promise<StartRecordingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedStartRecordingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				}),
			stopRecording: (): Promise<StopRecordingResponse> =>
				new Promise((resolve, reject) => {
					const result = mockedStopRecordingRequest();
					result ? resolve(result) : reject(new Error(noResultProvided));
				})
		}
	};
});
