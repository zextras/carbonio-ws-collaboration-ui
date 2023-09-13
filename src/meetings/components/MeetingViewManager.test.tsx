/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event/setup/setup';
import React from 'react';

import MeetingViewManager from './MeetingViewManager';
import { mockUseParams } from '../../../jest-mocks';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom
} from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe, MeetingParticipant } from '../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { MeetingViewType } from '../../types/store/ActiveMeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

const gridModeViewTestId = 'gridModeView';
const cinemaModeViewTestId = 'cinemaModeView';
const faceToFaceModeViewTestId = 'faceToFaceModeView';

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'user1', owner: true }),
		createMockMember({ userId: 'user2', owner: true })
	],
	userSettings: { muted: false }
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: 'user1',
	sessionId: 'sessionIdUser1'
});

const user2Participant: MeetingParticipant = createMockParticipants({
	userId: 'user2',
	sessionId: 'sessionIdUser2'
});

const user3Participant: MeetingParticipant = createMockParticipants({
	userId: 'user3',
	sessionId: 'sessionIdUser3'
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant, user2Participant]
});

const setupBasicGroupMeeting = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
	mockUseParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(<MeetingViewManager />);
	return { user, store: result.current };
};

const setupMeetingWith3Participants = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
		result.current.addParticipant(groupMeeting.id, user3Participant);
	});
	mockUseParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(<MeetingViewManager />);
	return { user, store: result.current };
};

describe('MeetingViewManager', () => {
	test('Display the faceToFace viewMode with 2 participants', async () => {
		setupBasicGroupMeeting();
		const faceToFaceSelected = await screen.findByTestId(faceToFaceModeViewTestId);
		expect(faceToFaceSelected).toBeInTheDocument();
	});
	test('Display change view from faceToFace to cinema mode on first time when a participant joins', async () => {
		const { store } = setupBasicGroupMeeting();
		const faceToFaceSelected = await screen.findByTestId(faceToFaceModeViewTestId);
		expect(faceToFaceSelected).toBeInTheDocument();
		act(() => {
			store.addParticipant(groupMeeting.id, user3Participant);
		});
		const cinemaSelected = await screen.findByTestId(cinemaModeViewTestId);
		expect(cinemaSelected).toBeInTheDocument();
	});
	test('Display faceToFace mode when a participant leaves and now there are 2 participants', async () => {
		const { store } = setupMeetingWith3Participants();
		const cinemaSelected = await screen.findByTestId(cinemaModeViewTestId);
		expect(cinemaSelected).toBeInTheDocument();
		act(() => {
			store.removeParticipant(groupMeeting.id, user3Participant.userId);
		});
		const faceToFaceSelected = await screen.findByTestId(faceToFaceModeViewTestId);
		expect(faceToFaceSelected).toBeInTheDocument();
	});
	test('Switch from cinemaMode to gridMode', async () => {
		const { store } = setupMeetingWith3Participants();
		const cinemaSelected = await screen.findByTestId(cinemaModeViewTestId);
		expect(cinemaSelected).toBeInTheDocument();
		act(() => {
			store.setMeetingViewSelected(groupMeeting.id, MeetingViewType.GRID);
		});
		const gridModeViewSelected = await screen.findByTestId(gridModeViewTestId);
		expect(gridModeViewSelected).toBeInTheDocument();
	});
	test('Get back from grid to faceToFace when there are remain only 2 participants', async () => {
		const { store } = setupMeetingWith3Participants();
		act(() => {
			store.setMeetingViewSelected(groupMeeting.id, MeetingViewType.GRID);
		});
		const gridModeViewSelected = await screen.findByTestId(gridModeViewTestId);
		expect(gridModeViewSelected).toBeInTheDocument();
		act(() => {
			store.removeParticipant(groupMeeting.id, user3Participant.userId);
		});
		const faceToFaceSelected = await screen.findByTestId(faceToFaceModeViewTestId);
		expect(faceToFaceSelected).toBeInTheDocument();
	});
	test('Switch from cinemaMode to gridMode to cinemaMode again', async () => {
		const { store } = setupMeetingWith3Participants();
		const cinemaSelected = await screen.findByTestId(cinemaModeViewTestId);
		expect(cinemaSelected).toBeInTheDocument();
		act(() => {
			store.setMeetingViewSelected(groupMeeting.id, MeetingViewType.GRID);
		});
		const gridModeViewSelected = await screen.findByTestId(gridModeViewTestId);
		expect(gridModeViewSelected).toBeInTheDocument();
		act(() => {
			store.setMeetingViewSelected(groupMeeting.id, MeetingViewType.CINEMA);
		});
		const cinemaSelectedAgain = await screen.findByTestId(cinemaModeViewTestId);
		expect(cinemaSelectedAgain).toBeInTheDocument();
	});
});
