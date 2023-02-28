/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Account, AccountSettings, INotificationManager } from '@zextras/carbonio-shell-ui';
import React, { ReactElement } from 'react';

import { AutoCompleteGalResponse } from './src/network/soap/AutoCompleteRequest';
import {
	AddRoomResponse,
	DeleteRoomPictureResponse,
	UpdateRoomPictureResponse,
	ClearRoomHistoryResponse,
	MuteRoomResponse,
	UnmuteRoomResponse,
	UpdateRoomResponse
} from './src/types/network/responses/roomsResponses';
import {
	GetUserPictureResponse,
	GetUserResponse
} from './src/types/network/responses/usersResponses';

// MOCKED SHELL UI
export const mockNotify: jest.Mock = jest.fn();
jest.mock('@zextras/carbonio-shell-ui', () => ({
	Spinner: (): ReactElement => <div>spinner</div>,
	getNotificationManager: (): INotificationManager => ({
		showPopup: () => null,
		notify: () => mockNotify(),
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
	})
}));

// MOCKED USEROUTING
jest.mock('./src/hooks/useRouting', () => {
	const goToMainPage = jest.fn();
	const goToRoomPage = jest.fn();

	return jest.fn(() => ({
		goToMainPage,
		goToRoomPage
	}));
});

// MOCKED USEMEDIAQUERYCHECK
export const mockUseMediaQueryCheck = jest.fn();
jest.mock('./src/utils/useMediaQueryCheck', () => mockUseMediaQueryCheck);

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
export const mockedGetURLPreview: jest.Mock = jest.fn();

jest.mock('./src/network', () => ({
	RoomsApi: {
		addRoom: (): Promise<AddRoomResponse> =>
			new Promise((resolve, reject) => {
				const result = mockedAddRoomRequest();
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
		getURLPreview: mockedGetURLPreview
	}
}));
