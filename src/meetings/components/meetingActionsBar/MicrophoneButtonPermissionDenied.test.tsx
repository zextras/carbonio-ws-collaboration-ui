/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import MicrophoneButton from './MicrophoneButton';
import { useParams } from '../../../../__mocks__/react-router';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import {
	mockedEnumerateDevices,
	mockedGetUserMedia,
	mockMediaDevicesReject
} from '../../../tests/mocks/global';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';

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

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant]
});

const mockSetIsAudioListOpen = jest.fn();

const defaultSetup = (): { user: UserEvent } => {
	const refList = React.createRef<HTMLDivElement>();
	useParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(
		<MicrophoneButton
			audioDropdownRef={refList}
			isAudioListOpen={false}
			setIsAudioListOpen={mockSetIsAudioListOpen}
		/>
	);
	return { user };
};

beforeAll(() => {
	mockMediaDevicesReject();
});

describe('Microphone button - permission denied', () => {
	test('User clicks on the button', async () => {
		mockedEnumerateDevices.mockRejectedValue('error enumerateDevices');
		mockedGetUserMedia.mockRejectedValue('error getUserMedia');

		const err = jest.spyOn(console, 'error').mockImplementation();

		const { user } = defaultSetup();

		const button = screen.getByTestId('microphone-button');
		expect(button).toBeVisible();

		await act(() => user.click(button));

		const snackbar = await screen.findByText('Grant browser permissions to enable resources');

		expect(snackbar).toBeInTheDocument();
		expect(err).toHaveBeenCalled();
	});
});
