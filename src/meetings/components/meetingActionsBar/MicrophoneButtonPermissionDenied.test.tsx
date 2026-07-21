/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import * as ReactRouter from 'react-router-dom';

import MicrophoneButton from './MicrophoneButton';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomType } from 'wsc-shared';

const user1 = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2 = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3 = createMockUser({ id: 'user3Id', name: 'user 3' });
const user4 = createMockUser({ id: 'user4Id', name: 'user 4' });

const member1 = { userId: user1.id, owner: true };
const member2 = { userId: user2.id, owner: false };
const member3 = { userId: user3.id, owner: true };
const member4 = { userId: user4.id, owner: false };

const room = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3, member4]
});

const user1Participant = createMockParticipants({ userId: user1.id });

const meeting = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant]
});

const mockSetIsAudioListOpen = vi.fn();

const defaultSetup = (): { user: UserEvent } => {
	const refList = React.createRef<HTMLDivElement>();
	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(
		<MicrophoneButton
			audioDropdownRef={refList}
			isAudioListOpen={false}
			setIsAudioListOpen={mockSetIsAudioListOpen}
		/>
	);
	return { user };
};

describe('Microphone button - permission denied', () => {
	test('User clicks on the button', async () => {
		useStore.getState().setWebsocketStatus(true);
		vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue('error getUserMedia');

		const err = vi.spyOn(console, 'error').mockImplementation(() => {});

		const { user } = defaultSetup();

		const button = screen.getByTestId('microphone-button');
		expect(button).toBeVisible();

		await act(() => user.click(button));

		const snackbar = await screen.findByText('Grant browser permissions to enable resources');

		expect(snackbar).toBeInTheDocument();
		expect(err).toHaveBeenCalled();
	});
});
