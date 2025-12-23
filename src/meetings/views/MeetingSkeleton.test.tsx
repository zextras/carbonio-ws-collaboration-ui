/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import MeetingSkeleton from './MeetingSkeleton';
import { mockGoToInfoPage } from '../../hooks/__mocks__/useRouting';
import meetingsApi from '../../network/apis/MeetingsApi';
import useStore from '../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { routerContextSetup, setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import { STREAM_TYPE, VirtualBackgroundType } from '../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { mockInitialize } from '../components/virtualBackground/__mocks__/SelfieSegmentationManager';
import { MEETINGS_ROUTES, PAGE_INFO_TYPE } from '../contexts/routerContext';

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

const user1Participant: MeetingParticipant = createMockParticipants({ userId: user1.id });

const user2Participant: MeetingParticipant = createMockParticipants({ userId: user2.id });

const user3Participant: MeetingParticipant = createMockParticipants({ userId: user3.id });

const user4Participant: MeetingParticipant = createMockParticipants({ userId: user4.id });

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const storeSetupGroupMeetingSkeleton = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setUserInfo([user1, user2, user3]);
	store.setLoginInfo(user1.id, user1.name);
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id, { enabled: false }, { enabled: true, deviceId: 'videoId' });
	store.setLocalStreams(STREAM_TYPE.VIDEO, new MediaStream());
	store.setAttributes(createMockAttributesList());
	const { user } = routerContextSetup(<MeetingSkeleton />, {
		route: MEETINGS_ROUTES.MEETING,
		meetingId: meeting.id
	});

	return { user, store };
};

vi.mock('../../hooks/useRouting');
vi.mock('../components/virtualBackground/SelfieSegmentationManager');
vi.mock('../../utils/MeetingsUtils');

describe('Sidebar interactions', () => {
	test('Enable full screen and sidebar must be closed', async () => {
		document.documentElement.requestFullscreen = vi.fn(() => Promise.resolve());
		const { user } = storeSetupGroupMeetingSkeleton();
		await waitFor(() => user.hover(screen.getByTestId(meetingActionBarLabel)));
		const moreActions = await screen.findByTestId('more-actions');
		await user.click(moreActions);

		const fullScreen = await screen.findByText(/Enable full screen/i);
		await user.click(fullScreen);

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
		const spyOnLeaveMeeting = vi.spyOn(meetingsApi, 'leaveMeeting');
		const { user } = storeSetupGroupMeetingSkeleton();
		const meetingActionBar = await screen.findByTestId(meetingActionBarLabel);
		await user.hover(meetingActionBar);

		const endMeetingButton = await screen.findByTestId('icon: LogOutOutline');
		await user.click(endMeetingButton);
		await user.click(endMeetingButton);

		expect(spyOnLeaveMeeting).toHaveBeenCalled();
		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.MEETING_ENDED);
	});

	test('User click once leave button and then move away', async () => {
		const { user } = storeSetupGroupMeetingSkeleton();
		const meetingActionBar = await screen.findByTestId(meetingActionBarLabel);
		await user.hover(meetingActionBar);

		const endMeetingButton = await screen.findByTestId('icon: LogOutOutline');
		await user.click(endMeetingButton);

		const sidebarButton = await screen.findByTestId('sidebar_button');
		await user.hover(sidebarButton);

		await waitFor(() => {
			const text = screen.queryByText('Leave Meeting?');
			expect(text).not.toBeInTheDocument();
		});
	});

	test('Toggle pin video and switch to cinema mode', async () => {
		storeSetupGroupMeetingSkeleton();
		await waitFor(() => {
			act(() => useStore.getState().setPinnedTile({ userId: user3.id, type: STREAM_TYPE.VIDEO }));
		});
		const cinemaModeView = await screen.findByTestId('cinemaModeView');
		expect(cinemaModeView).toBeInTheDocument();
	});

	test('User leave meeting view switch to face to face', async () => {
		storeSetupGroupMeetingSkeleton();
		const store = useStore.getState();

		await waitFor(() => {
			act(() => {
				store.setPinnedTile({ userId: user2.id, type: STREAM_TYPE.VIDEO });
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
				store.setPinnedTile({ userId: user3.id, type: STREAM_TYPE.SCREEN });
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
		expect(meetingActionBar).toHaveStyle('transform: translateY(5rem)');
		await waitFor(() => user.hover(screen.getByTestId('meeting_view_container')));
		expect(meetingActionBar).toHaveStyle('transform: translateY(-1rem)');
	});
});

describe('Virtual Background setup', () => {
	test('turn on and off blur', async () => {
		HTMLCanvasElement.prototype.captureStream = vi.fn().mockReturnValue(new MediaStream());

		const { store } = storeSetupGroupMeetingSkeleton();
		expect(store.activeMeeting).not.toBeDefined();

		// turn on blur
		act(() => {
			store.setBackgroundImage(VirtualBackgroundType.BLUR);
		});

		await waitFor(() => {
			const updatedStore = useStore.getState();
			expect(updatedStore.activeMeeting?.virtualBackground.updatedStream).toBeDefined();
		});
		expect(mockInitialize).toHaveBeenCalled();

		// turn off blur
		act(() => {
			store.setBackgroundImage(VirtualBackgroundType.NONE);
		});
		const updatedStore2 = useStore.getState();
		expect(updatedStore2.activeMeeting?.virtualBackground.updatedStream).not.toBeDefined();
	});
});
