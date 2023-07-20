/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Account,
	AccountSettings,
	AppRoute,
	INotificationManager
} from '@zextras/carbonio-shell-ui';
import React, { ReactElement } from 'react';

import { AutoCompleteGalResponse } from './src/network/soap/AutoCompleteRequest';
import {
	CreateMeetingResponse,
	DeleteMeetingResponse,
	GetMeetingResponse,
	JoinMeetingResponse,
	LeaveMeetingResponse,
	StartMeetingResponse,
	StopMeetingResponse
} from './src/types/network/responses/meetingsResponses';
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
	UpdateRoomResponse
} from './src/types/network/responses/roomsResponses';
import {
	GetUserPictureResponse,
	GetUserResponse
} from './src/types/network/responses/usersResponses';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

// MOCKED SHELL UI
export const mockNotify: jest.Mock = jest.fn();
jest.mock('@zextras/carbonio-shell-ui', () => ({
	Spinner: (): ReactElement => <div>spinner</div>,
	getNotificationManager: (): INotificationManager => ({
		showPopup: () => null,
		notify: mockNotify,
		multipleNotify: () => null,
		playSound: () => null
	}),
	getUserAccount: (): Account => ({
		id: 'myId',
		name: 'User 1',
		displayName: 'User 1',
		signatures: { signature: [] },
		identities: '',
		rights: { targets: [] }
	}),
	SettingsHeader: (): ReactElement => <div>settings header</div>,
	useUserSettings: (): AccountSettings => ({
		attrs: {},
		props: [{ name: '', zimlet: '', _content: '' }],
		prefs: {}
	}),
	useCurrentRoute: (): AppRoute => ({
		id: 'chats',
		route: 'chats',
		app: 'Chats'
	})
}));

// MOCKED USEROUTING
export const mockGoToRoomPage: jest.Mock = jest.fn();
export const mockGoToMainPage: jest.Mock = jest.fn();
export const mockGoToMeetingPage: jest.Mock = jest.fn();

jest.mock('./src/hooks/useRouting', () => {
	const goToMainPage = mockGoToMainPage;
	const goToRoomPage = mockGoToRoomPage;
	const goToMeetingPage = mockGoToMeetingPage;

	return jest.fn(() => ({
		goToMainPage,
		goToRoomPage,
		goToMeetingPage
	}));
});

// MOCKED USEMEDIAQUERYCHECK
export const mockUseMediaQueryCheck = jest.fn();
jest.mock('./src/hooks/useMediaQueryCheck', () => mockUseMediaQueryCheck);

// MOCKED AUTOCOMPLETEREQUEST
export const mockedAutoCompleteGalRequest: jest.Mock = jest.fn();
mockedAutoCompleteGalRequest.mockReturnValue([]);
jest.mock('./src/network/soap/AutoCompleteRequest', () => ({
	autoCompleteGalRequest: (): Promise<AutoCompleteGalResponse> =>
		new Promise((resolve, reject) => {
			const result = mockedAutoCompleteGalRequest();
			result ? resolve(result) : reject(new Error('no result provided'));
		})
}));

// MOCKED APIs
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
export const mockedGetURLUserPicture: jest.Mock = jest.fn();
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
export const mockedLeaveMeetingRequest: jest.Mock = jest.fn();
export const mockedStopMeetingRequest: jest.Mock = jest.fn();
export const mockedDeleteMeetingRequest: jest.Mock = jest.fn();

jest.mock('./src/network', () => ({
	RoomsApi: {
		addRoom: (): Promise<AddRoomResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedAddRoomRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		getRoom: (): Promise<GetRoomResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedGetRoomRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		deleteRoom: (): Promise<DeleteRoomResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedDeleteRoomRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		clearRoomHistory: (): Promise<ClearRoomHistoryResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedClearHistoryRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		getURLRoomPicture: (): string => 'image.jpeg',
		updateRoomPicture: (): Promise<UpdateRoomPictureResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedUpdateRoomPictureRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		deleteRoomPicture: (): Promise<DeleteRoomPictureResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedDeleteRoomPictureRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		muteRoomNotification: (): Promise<MuteRoomResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedMuteRoomNotificationRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		unmuteRoomNotification: (): Promise<UnmuteRoomResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedUnmuteRoomNotificationRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		updateRoom: (): Promise<UpdateRoomResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedUpdateRoomRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		deleteRoomMember: (): Promise<DeleteRoomMemberResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedDeleteRoomMemberRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		promoteRoomMember: (): Promise<PromoteRoomMemberResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedPromoteRoomMemberRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		demotesRoomMember: (): Promise<DemotesRoomMemberResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedDemotesRoomMemberRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		addRoomMember: (): Promise<AddRoomMemberResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedAddRoomMemberRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		forwardMessages: (): Promise<ForwardMessagesResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedForwardMessagesRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			})
	},
	UsersApi: {
		getUser: (): Promise<GetUserResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedGetUserRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		getUserPicture: (): Promise<GetUserPictureResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedGetUserPictureRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		getURLUserPicture: (): string => 'image.url',
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		getDebouncedUser: (): void => {}
	},
	AttachmentsApi: {
		getURLAttachment: mockedGetURLAttachment,
		getImagePreviewURL: mockedGetImageURL,
		getImageThumbnailURL: mockedGetImageThumbnailURL,
		getPdfPreviewURL: mockedGetPdfURL,
		getPdfThumbnailURL: mockedGetPdfThumbnailURL
	},
	MeetingsApi: {
		getMeeting: (): Promise<GetMeetingResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedGetMeetingRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		createPermanentMeeting: (): Promise<CreateMeetingResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedCreateMeetingRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		startMeeting: (): Promise<StartMeetingResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedStartMeetingRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		joinMeeting: (): Promise<JoinMeetingResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedJoinMeetingRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		leaveMeeting: (): Promise<LeaveMeetingResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedLeaveMeetingRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		stopMeeting: (): Promise<StopMeetingResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedStopMeetingRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			}),
		deleteMeeting: (): Promise<DeleteMeetingResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedDeleteMeetingRequest();
				result ? resolve(result) : reject(new Error('no result provided'));
			})
	}
}));

export const mockUseParams = jest.fn();

jest.mock('react-router', () => ({
	...jest.requireActual('react-router'),
	useParams: mockUseParams
}));

export const fetchResponse: jest.Mock = jest.fn(() => ({}));

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () => fetchResponse(),
		ok: true,
		headers: { get: (): string => 'application/json' }
	})
);

global.URL.createObjectURL = jest.fn();

Object.defineProperty(window, 'crypto', {
	value: {
		getRandomValues: (arr: string[]) => crypto.randomBytes(arr.length)
	}
});
