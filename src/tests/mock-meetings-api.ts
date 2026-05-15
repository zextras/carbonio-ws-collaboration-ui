/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IMeetingsApi } from '../types/network/apis/IMeetingsApi';

export const mockMeetingsApi = {
	listMeetings: vi.fn().mockResolvedValue([]),
	createMeeting: vi.fn().mockResolvedValue({}),
	getMeeting: vi.fn().mockResolvedValue({}),
	getMeetingByMeetingId: vi.fn().mockResolvedValue({}),
	startMeeting: vi.fn().mockResolvedValue({}),
	getWaitingList: vi.fn().mockResolvedValue({ users: [] }),
	joinMeeting: vi.fn().mockResolvedValue({ status: 'ACCEPTED' }),
	enterMeeting: vi.fn().mockResolvedValue(''),
	leaveMeeting: vi.fn().mockResolvedValue(undefined),
	stopMeeting: vi.fn().mockResolvedValue(undefined),
	declineMeeting: vi.fn().mockResolvedValue(undefined),
	deleteMeeting: vi.fn().mockResolvedValue(undefined),
	createAudioOffer: vi.fn().mockResolvedValue(undefined),
	updateAudioStreamStatus: vi.fn().mockResolvedValue(undefined),
	updateMediaOffer: vi.fn().mockResolvedValue(undefined),
	subscribeToMedia: vi.fn().mockResolvedValue(undefined),
	createMediaAnswer: vi.fn().mockResolvedValue(undefined),
	getScheduledMeetingName: vi.fn().mockResolvedValue({ name: '' }),
	leaveWaitingRoom: vi.fn().mockResolvedValue(undefined),
	acceptWaitingUser: vi.fn().mockResolvedValue(undefined),
	startRecording: vi.fn().mockResolvedValue(undefined),
	stopRecording: vi.fn().mockResolvedValue(undefined),
	raiseHand: vi.fn().mockResolvedValue(undefined),
	createGuestAccount: vi.fn().mockResolvedValue({ id: '', zmToken: '', zxToken: '' }),
	getLoginConfig: vi.fn().mockResolvedValue({})
} satisfies IMeetingsApi;
