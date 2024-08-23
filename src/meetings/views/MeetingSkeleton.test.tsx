/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event';

import MeetingSkeleton from './MeetingSkeleton';
import { useParams } from '../../../__mocks__/react-router';
import { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import useStore from '../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { mockMediaDevicesResolve } from '../../tests/mocks/global';
import { mockedLeaveMeetingRequest } from '../../tests/mocks/network';
import { mockInitialize } from '../../tests/mocks/SelfieSegmentationManager';
import { mockGoToInfoPage } from '../../tests/mocks/useRouting';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';

const meetingActionBarLabel = 'meeting-action-bar';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });
const user4: UserBe = createMockUser({ id: 'user4Id', name: 'user 4' });

const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };
const member3: MemberBe = { userId: user3.id, owner: true };
const member4: MemberBe = { userId: user4.id, owner: false };

const room: RoomBe = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3, member4]
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: user1.id,
	sessionId: 'sessionIdUser1'
});

const user2Participant: MeetingParticipant = createMockParticipants({
	userId: user2.id,
	sessionId: 'sessionIdUser2'
});

const user3Participant: MeetingParticipant = createMockParticipants({
	userId: user3.id,
	sessionId: 'sessionIdUser3'
});

const user4Participant: MeetingParticipant = createMockParticipants({
	userId: user4.id,
	sessionId: 'sessionIdUser4'
});

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const storeSetupGroupMeetingSkeleton = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, true, 'videoId');
	store.setLocalStreams(meeting.id, STREAM_TYPE.VIDEO, new MediaStream());
	store.setCapabilities(createMockCapabilityList());
	useParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(<MeetingSkeleton />);

	return { user, store };
};

const mockCaptureStream = jest.fn().mockReturnValue(new MediaStream());
HTMLCanvasElement.prototype.captureStream = mockCaptureStream;

beforeAll(() => {
	mockMediaDevicesResolve();
});

describe('Sidebar interactions', () => {
	test('Enable full screen and sidebar must be closed', async () => {
		const { user } = storeSetupGroupMeetingSkeleton();
		await waitFor(() => user.hover(screen.getByTestId(meetingActionBarLabel)));
		const fullScreenButton = await screen.findByTestId('fullscreen-button');
		await waitFor(() => {
			act(() => {
				user.click(fullScreenButton);
			});
		});
		const meetingSidebar = screen.queryByTestId('meeting_sidebar');
		expect(meetingSidebar).toHaveStyle('width: 0');
	});
});

describe('Grid mode meeting view', () => {
	test('It should display the gridModeView component as default with 3 meeting participants', async () => {
		storeSetupGroupMeetingSkeleton();
		const gridModeView = await screen.findByTestId('gridModeView');
		expect(gridModeView).toBeInTheDocument();
	});

	test('Close the meeting', async () => {
		mockedLeaveMeetingRequest.mockResolvedValueOnce('Meeting left');
		const { user } = storeSetupGroupMeetingSkeleton();
		const meetingActionBar = await screen.findByTestId(meetingActionBarLabel);
		await waitFor(() => user.hover(meetingActionBar));

		const endMeetingButton = await screen.findByTestId('icon: LogOutOutline');
		await waitFor(() => user.click(endMeetingButton));
		await waitFor(() => user.click(endMeetingButton));

		expect(mockedLeaveMeetingRequest).toHaveBeenCalled();
		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.MEETING_ENDED);
	});

	test('User click once leave button and then move away', async () => {
		const { user } = storeSetupGroupMeetingSkeleton();
		const meetingActionBar = await screen.findByTestId(meetingActionBarLabel);
		await waitFor(() => user.hover(meetingActionBar));

		const endMeetingButton = await screen.findByTestId('icon: LogOutOutline');
		await waitFor(() => user.click(endMeetingButton));

		const sidebarButton = await screen.findByTestId('sidebar_button');
		await waitFor(() => user.hover(sidebarButton));

		const text = screen.queryByText('Leave Meeting?');
		expect(text).not.toBeInTheDocument();
	});

	test('Toggle pin video and switch to cinema mode', async () => {
		storeSetupGroupMeetingSkeleton();
		await waitFor(() => {
			act(() =>
				useStore.getState().setPinnedTile(meeting.id, { userId: user3.id, type: STREAM_TYPE.VIDEO })
			);
		});
		const cinemaModeView = await screen.findByTestId('cinemaModeView');
		expect(cinemaModeView).toBeInTheDocument();
	});

	test('User leave meeting view switch to face to face', async () => {
		storeSetupGroupMeetingSkeleton();
		const store = useStore.getState();

		await waitFor(() => {
			act(() => {
				store.setPinnedTile(meeting.id, { userId: user2.id, type: STREAM_TYPE.VIDEO });
				store.removeParticipant(meeting.id, user3.id);
			});
		});

		const faceToFaceModeView = await screen.findByTestId('faceToFaceModeView');
		expect(faceToFaceModeView).toBeInTheDocument();
	});

	test('Pinned central share screen get removed', async () => {
		storeSetupGroupMeetingSkeleton();
		const store = useStore.getState();

		await waitFor(() => {
			act(() => {
				store.addParticipant(meeting.id, user4Participant);
				store.changeStreamStatus(meeting.id, user3.id, STREAM_TYPE.SCREEN, true);
				store.setPinnedTile(meeting.id, { userId: user3.id, type: STREAM_TYPE.SCREEN });
			});
		});

		const cinemaModeView = await screen.findByTestId('cinemaModeView');
		expect(cinemaModeView).toBeInTheDocument();

		await waitFor(() => {
			act(() => {
				store.removeParticipant(meeting.id, user3.id);
			});
		});

		const gridModeView = await screen.findByTestId('gridModeView');
		expect(gridModeView).toBeInTheDocument();
	});
});

describe('Meeting action bar interaction with skeleton', () => {
	test('hover on different elements of the skeleton makes action bar appear and disappear', async () => {
		const { user } = setup(<MeetingSkeleton />);
		const meetingActionBar = await screen.findByTestId('meeting-action-bar');
		await waitFor(() => user.hover(screen.getByTestId('meeting_sidebar')));
		expect(meetingActionBar).toHaveStyle('transform: translateY( 5rem )');
		await waitFor(() => user.hover(screen.getByTestId('meeting_view_container')));
		expect(meetingActionBar).toHaveStyle('transform: translateY( -1rem )');
	});
});

describe('Virtual Background setup', () => {
	test('turn on and off blur', async () => {
		mockInitialize.mockReturnValue('initialized');
		const { store } = storeSetupGroupMeetingSkeleton();
		expect(store.activeMeeting[meeting.id]).not.toBeDefined();

		// turn on blur
		await waitFor(() => {
			store.setBlur(meeting.id, true);
		});
		const updatedStore = useStore.getState();
		expect(updatedStore.activeMeeting[meeting.id].virtualBackground.updatedStream).toBeDefined();
		expect(mockInitialize).toHaveBeenCalled();

		// turn off blur
		await waitFor(() => {
			store.setBlur(meeting.id, false);
		});
		const updatedStore2 = useStore.getState();
		expect(
			updatedStore2.activeMeeting[meeting.id].virtualBackground.updatedStream
		).not.toBeDefined();
	});
});
