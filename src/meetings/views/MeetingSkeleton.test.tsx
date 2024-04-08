/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event';

import MeetingSkeleton from './MeetingSkeleton';
import { useParams } from '../../../__mocks__/react-router';
import { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { mockedLeaveMeetingRequest } from '../../tests/mocks/network';
import { mockGoToInfoPage } from '../../tests/mocks/useRouting';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';

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

const storeSetupGroupMeetingSkeleton = (): { user: UserEvent } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setUserInfo(user1);
		result.current.setUserInfo(user2);
		result.current.setUserInfo(user3);
		result.current.setLoginInfo(user1.id, user1.name);
		result.current.addRoom(room);
		result.current.addMeeting(meeting);
		result.current.meetingConnection(meeting.id, false, undefined, false, undefined);
	});
	useParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(<MeetingSkeleton />);

	return { user };
};

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
		expect(mockGoToInfoPage).toBeCalledWith(PAGE_INFO_TYPE.MEETING_ENDED);
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
