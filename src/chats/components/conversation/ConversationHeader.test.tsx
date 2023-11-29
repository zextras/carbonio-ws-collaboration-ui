/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ConversationHeader from './ConversationHeader';
import { mockUseMediaQueryCheck } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMember,
	createMockRoom
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	name: 'name',
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

describe('Conversation header test', () => {
	test('Width of the screen is smaller than 1024 px', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		mockUseMediaQueryCheck.mockReturnValueOnce(false);
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		const infoIcon = screen.getByTestId('icon: InfoOutline');
		expect(infoIcon).toBeInTheDocument();
	});
	test('Width of the screen is bigger than 1024 px', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		mockUseMediaQueryCheck.mockReturnValueOnce(true);
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		expect(screen.queryByTestId('icon: InfoOutline')).toBeNull();
	});

	test('Meeting button is displayed when canVideoCall capability is set to true', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.setCapabilities(createMockCapabilityList({ canVideoCall: true }));
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		expect(screen.getByTestId('ConversationHeaderMeetingButton')).toBeInTheDocument();
	});

	test("Meeting button isn't displayed when canVideoCall capability is set to false", async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.setCapabilities(createMockCapabilityList({ canVideoCall: false }));
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		expect(screen.queryByTestId('ConversationHeaderMeetingButton')).not.toBeInTheDocument();
	});
});
