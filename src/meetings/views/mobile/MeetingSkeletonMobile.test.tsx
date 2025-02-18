/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingSkeletonMobile from './MeetingSkeletonMobile';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { contextSetup } from '../../../tests/test-utils';

const room = createMockRoom({ meetingId: 'meetingId' });
const meeting = createMockMeeting({ roomId: room.id });

describe('MeetingSkeletonMobile test', () => {
	test('Default view is tiles view', () => {
		contextSetup(<MeetingSkeletonMobile />, { meetingId: room.meetingId });
		const view = screen.getByTestId('mobile_skeleton_view');
		expect(view).toBeInTheDocument();
	});

	test('Conversation view', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.addMeeting(meeting);
		const { user } = contextSetup(<MeetingSkeletonMobile />, { meetingId: room.meetingId });
		const conversationButton = screen.getByTestId('icon: MessageCircle');
		expect(conversationButton).toBeInTheDocument();

		await user.click(conversationButton);
		const view = screen.getByTestId('mobile_conversation_view');
		expect(view).toBeInTheDocument();
	});

	test('Participants view', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.addMeeting(meeting);
		const { user } = contextSetup(<MeetingSkeletonMobile />, { meetingId: room.meetingId });
		const participantsButton = screen.getByTestId('icon: People');
		expect(participantsButton).toBeInTheDocument();

		await user.click(participantsButton);
		const view = screen.getByTestId('mobile_participants_view');
		expect(view).toBeInTheDocument();
	});
});
