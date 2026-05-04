/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ConversationInfoPanel from './ConversationInfoPanel';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: false }
});

const oneToOneRoom: RoomBe = createMockRoom({
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: 'myId' })]
});

const user1 = createMockUser({ id: 'user1Id', name: 'User 1' });

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([oneToOneRoom, groupRoom]);
	store.setPlaceholderRoom(user1.id);
});

const tabBarTestId = 'infoPanelTabBar';
const mediaGalleryTabLabel = 'Media Gallery';

describe('Conversation info panel', () => {
	test('Shows tab bar with Actions, Members and Media Gallery tabs in a group room', async () => {
		setup(<ConversationInfoPanel roomId={groupRoom.id} goToChatView={vi.fn()} />);
		expect(screen.getByTestId(tabBarTestId)).toBeInTheDocument();
		expect(screen.getByText('Actions')).toBeInTheDocument();
		expect(screen.getByText('Members')).toBeInTheDocument();
		expect(screen.getByText(mediaGalleryTabLabel)).toBeInTheDocument();
	});

	test('Shows only Actions and Media Gallery tabs in a one-to-one room', async () => {
		setup(<ConversationInfoPanel roomId={oneToOneRoom.id} goToChatView={vi.fn()} />);
		expect(screen.getByTestId(tabBarTestId)).toBeInTheDocument();
		expect(screen.getByText('Actions')).toBeInTheDocument();
		expect(screen.queryByText('Members')).not.toBeInTheDocument();
		expect(screen.getByText(mediaGalleryTabLabel)).toBeInTheDocument();
	});

	test('Actions tab content is visible by default', async () => {
		setup(<ConversationInfoPanel roomId={groupRoom.id} goToChatView={vi.fn()} />);
		expect(screen.getByTestId('actionsTabContent')).toBeInTheDocument();
	});

	test('Media Gallery tab content is not rendered until the tab is first selected', async () => {
		const { user } = setup(<ConversationInfoPanel roomId={groupRoom.id} goToChatView={vi.fn()} />);
		expect(screen.queryByTestId('mediaGalleryTab')).not.toBeInTheDocument();

		await user.click(screen.getByText(mediaGalleryTabLabel));
		expect(screen.getByTestId('mediaGalleryTab')).toBeInTheDocument();
	});

	test('Tab bar is not shown when the room is a placeholder', async () => {
		setup(<ConversationInfoPanel roomId={`placeholder-${user1.id}`} goToChatView={vi.fn()} />);
		expect(screen.queryByTestId(tabBarTestId)).not.toBeInTheDocument();
	});
});
