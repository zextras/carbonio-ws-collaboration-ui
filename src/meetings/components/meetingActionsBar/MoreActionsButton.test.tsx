/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act, renderHook } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import * as ReactRouter from 'react-router-dom';

import MoreActionsButton from './MoreActionsButton';
import useStore from '../../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { routerContextSetup, setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import {
	MeetingAccordionType,
	MeetingViewType,
	STREAM_TYPE
} from '../../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { PiPContext } from '../pictureInPicture/PictureInPictureProvider';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({
	id: 'user3Id',
	name: 'user 3'
});
const user4: UserBe = createMockUser({ id: 'user4Id', name: 'user 4' });

const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };
const member3: MemberBe = { userId: user3.id, owner: true };

const room: RoomBe = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3]
});

const user1Participant: MeetingParticipant = createMockParticipants({ userId: user1.id });

const user3Participant: MeetingParticipant = createMockParticipants({ userId: user3.id });

const user2Participant: MeetingParticipant = createMockParticipants({ userId: user2.id });

const user4Participant: MeetingParticipant = createMockParticipants({ userId: user4.id });

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const meetingWithOnePerson: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant]
});

const storeSetupGroupMeeting = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setUserInfo([user1, user2, user3]);
	store.setLoginInfo(user1.id, user1.name);
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);

	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = routerContextSetup(<MoreActionsButton />, { meetingId: meeting.id });

	return { user, store };
};

const storeSetupGroupMeetingWithOnePerson = (): { user: UserEvent } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setUserInfo([user1]);
		result.current.setLoginInfo(user1.id, user1.name);
		result.current.addRooms([room]);
		result.current.addMeetings([meetingWithOnePerson]);
		result.current.meetingConnection(meetingWithOnePerson.id);
	});
	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: meetingWithOnePerson.id });
	const { user } = setup(<MoreActionsButton />);

	return { user };
};

const customPiPContextValue = {
	isSupported: true,
	requestPipWindow: vi.fn(),
	pipWindow: null,
	closePipWindow: vi.fn()
};

const storeSetupGroupMeetingPip = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setUserInfo([user1, user2, user3]);
	store.setLoginInfo(user1.id, user1.name);
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);
	store.setLocalStreams(STREAM_TYPE.VIDEO, new MediaStream());
	store.setAttributes(createMockAttributesList());
	store.setTalkingUser(user2.id, true);
	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(
		<PiPContext.Provider value={customPiPContextValue}>
			<MoreActionsButton />
		</PiPContext.Provider>
	);

	return { user, store };
};

const moreActionsTestId = 'more-actions';

describe('Meeting action bar - More actions button interactions', () => {
	test('Check full screen mode is set correctly', async () => {
		document.documentElement.requestFullscreen = vi.fn(() => Promise.resolve());
		const { user } = storeSetupGroupMeeting();

		const moreActions = await screen.findByTestId(moreActionsTestId);
		await user.click(moreActions);

		const fullScreen = await screen.findByText(/Enable full screen/i);
		await user.click(fullScreen);
		expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
	});

	test('When full screen mode is enabled in grid view, meeting sidebar will be closed ', async () => {
		useStore.getState().setMeetingViewSelected(MeetingViewType.GRID);
		const { user } = storeSetupGroupMeeting();

		const moreActions = await screen.findByTestId(moreActionsTestId);
		await user.click(moreActions);

		const fullScreen = await screen.findByText(/Enable full screen/i);
		await user.click(fullScreen);
		const sidebarIsOpened =
			useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.GENERAL];
		expect(sidebarIsOpened).toBe(false);
	});

	test('When full screen mode is enabled in cinema view, meeting sidebar and carousel will be closed ', async () => {
		useStore.getState().setMeetingViewSelected(MeetingViewType.CINEMA);
		const { user } = storeSetupGroupMeeting();

		const moreActions = await screen.findByTestId(moreActionsTestId);
		await user.click(moreActions);

		const switchButton = await screen.findByText(/Cinema view/i);
		await user.click(switchButton);

		await user.click(moreActions);

		const fullScreen = await screen.findByText(/Enable full screen/i);
		await user.click(fullScreen);
		const sidebarIsOpened =
			useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.GENERAL];
		expect(sidebarIsOpened).toBe(false);
		const isCarouselVisible = useStore.getState().activeMeeting?.isCarouselVisible;
		expect(isCarouselVisible).toBe(false);
	});

	test('SwitchView button is not visible with one or two participants', async () => {
		const { user } = storeSetupGroupMeetingWithOnePerson();

		const moreActions = await screen.findByTestId(moreActionsTestId);
		await user.click(moreActions);

		expect(screen.queryByText(/Cinema view/i)).not.toBeInTheDocument();

		// Add a second participant
		act(() => {
			useStore.getState().addParticipant(meetingWithOnePerson.id, user4Participant);
		});
		expect(screen.queryByText(/Cinema view/i)).not.toBeInTheDocument();
	});

	test('SwitchView button becomes visible with at least three participants', async () => {
		const { user } = storeSetupGroupMeeting();

		const moreActions = await screen.findByTestId(moreActionsTestId);
		await user.click(moreActions);

		const switchButton = await screen.findByText(/Cinema view/i);
		expect(switchButton).toBeInTheDocument();
	});

	test('SwitchView button toggles between grid and cinema view', async () => {
		const { user } = storeSetupGroupMeeting();

		expect(useStore.getState().activeMeeting?.meetingViewSelected).toBe(MeetingViewType.GRID);

		const moreActions = await screen.findByTestId(moreActionsTestId);
		await user.click(moreActions);

		const switchButton = await screen.findByText(/Cinema view/i);
		await user.click(switchButton);

		expect(useStore.getState().activeMeeting?.meetingViewSelected).toBe(MeetingViewType.CINEMA);
	});

	test('user toggle pip', async () => {
		const { user } = storeSetupGroupMeetingPip();
		const moreActions = await screen.findByTestId('more-actions');
		await user.click(moreActions);

		const pipButton = screen.getByText('Enable PiP');
		await user.click(pipButton);
		expect(customPiPContextValue.requestPipWindow).toHaveBeenCalled();
	});
});
