/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ConversationHeader from './ConversationHeader';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { mockUseMediaQueryCheck } from '../../../tests/mocks/useMediaQueryCheck';
import { setup } from '../../../tests/test-utils';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1 = createMockUser({ id: 'user1Id', name: 'User 1' });

const mockedRoom = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	name: 'name',
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.addRoom(mockedRoom);
	store.setPlaceholderRoom(user1.id);
});
describe('Conversation header test', () => {
	test('Width of the screen is smaller than 1024 px', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(false);
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		const infoIcon = screen.getByTestId('icon: InfoOutline');
		expect(infoIcon).toBeInTheDocument();
	});

	test('Width of the screen is bigger than 1024 px', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(true);
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		expect(screen.queryByTestId('icon: InfoOutline')).toBeNull();
	});

	test('Meeting button is displayed when canVideoCall capability is set to true', async () => {
		const store: RootStore = useStore.getState();
		store.setCapabilities(createMockCapabilityList({ canVideoCall: true }));
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		expect(screen.getByTestId('ConversationHeaderMeetingButton')).toBeInTheDocument();
	});

	test("Meeting button isn't displayed when canVideoCall capability is set to false", async () => {
		const store: RootStore = useStore.getState();
		store.setCapabilities(createMockCapabilityList({ canVideoCall: false }));
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		expect(screen.queryByTestId('ConversationHeaderMeetingButton')).not.toBeInTheDocument();
	});

	test("Meeting button isn't displayed when the room is a placeholder", async () => {
		const store: RootStore = useStore.getState();
		store.setCapabilities(createMockCapabilityList({ canVideoCall: true }));
		setup(<ConversationHeader roomId={`placeholder-${user1.id}`} setInfoPanelOpen={jest.fn()} />);
		expect(screen.queryByTestId('ConversationHeaderMeetingButton')).not.toBeInTheDocument();
	});
});
