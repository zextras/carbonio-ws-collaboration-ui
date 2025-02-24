/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import * as ReactRouter from 'react-router';

import PictureInPictureButton from './PictureInPictureButton';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { PiPContext } from '../pictureInPicture/PictureInPictureProvider';

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

const customPiPContextValue = {
	isSupported: true,
	requestPipWindow: jest.fn(),
	pipWindow: null,
	closePipWindow: jest.fn()
};

const storeSetupGroupMeetingPip = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
	store.setLocalStreams(meeting.id, STREAM_TYPE.VIDEO, new MediaStream());
	store.setCapabilities(createMockCapabilityList());
	store.setTalkingUser(meeting.id, user2.id, true);
	const spyUseParams = jest.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(
		<PiPContext.Provider value={customPiPContextValue}>
			<PictureInPictureButton />
		</PiPContext.Provider>
	);

	return { user, store };
};

describe('PictureInPictureButton', () => {
	test('user toggle pip', async () => {
		const { user } = storeSetupGroupMeetingPip();
		const pipButton = screen.getByTestId('icon: ExternalLinkOutline');
		expect(pipButton).toBeInTheDocument();
		await user.click(pipButton);
		expect(customPiPContextValue.requestPipWindow).toHaveBeenCalled();
	});
});
