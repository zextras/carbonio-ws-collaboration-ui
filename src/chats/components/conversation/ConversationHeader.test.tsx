/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

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
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const mockRobertoUser = createMockUser({
	id: 'idRoberto',
	email: 'roberto@user.com',
	name: 'Roberto'
});

const mockPaoloUser = createMockUser({
	id: 'idPaolo',
	email: 'paolo@user.com',
	name: 'Paolo'
});

const mockLucaUser = createMockUser({
	id: 'idLuca',
	email: 'Luca@user.com',
	name: 'Luca'
});

const mockGianniUser = createMockUser({
	id: 'idGianni',
	email: 'gianni@user.com',
	name: 'Gianni'
});

const mockQuintoUser = createMockUser({
	id: 'idQuinto',
	email: 'quinto@user.com',
	name: 'Quinto'
});

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	name: 'name',
	members: [
		createMockMember({ userId: mockPaoloUser.id, owner: true }),
		createMockMember({ userId: mockRobertoUser.id }),
		createMockMember({ userId: mockLucaUser.id }),
		createMockMember({ userId: mockGianniUser.id }),
		createMockMember({ userId: mockQuintoUser.id })
	]
});

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.addRoom(mockedRoom);
	store.setPlaceholderRoom(mockPaoloUser.id);
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
		setup(
			<ConversationHeader roomId={`placeholder-${mockPaoloUser.id}`} setInfoPanelOpen={jest.fn()} />
		);
		expect(screen.queryByTestId('ConversationHeaderMeetingButton')).not.toBeInTheDocument();
	});
});

describe('isWriting functionality', () => {
	test('is writing appears when someone is writing and disappear if not', async () => {
		const store: RootStore = useStore.getState();
		act(() => {
			store.addRoom(mockedRoom);
			store.setLoginInfo(mockPaoloUser.id, mockPaoloUser.name);
			store.setUserInfo(mockRobertoUser);
			store.setIsWriting(mockedRoom.id, mockRobertoUser.id, true);
		});

		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);

		const isWriting = await screen.findByTestId('is_writing_text');
		expect(isWriting).toBeInTheDocument();

		act(() => {
			store.setIsWriting(mockedRoom.id, mockRobertoUser.id, false);
			jest.advanceTimersByTime(4000);
		});

		expect(isWriting).not.toBeVisible();
	});

	test('is writing label for four or more users that are writing', async () => {
		const store: RootStore = useStore.getState();
		act(() => {
			store.addRoom(mockedRoom);
			store.setLoginInfo(mockPaoloUser.id, mockPaoloUser.name);
			store.setUserInfo(mockRobertoUser);
			store.setUserInfo(mockLucaUser);
			store.setUserInfo(mockGianniUser);
			store.setUserInfo(mockQuintoUser);

			store.setIsWriting(mockedRoom.id, mockRobertoUser.id, true);
			store.setIsWriting(mockedRoom.id, mockGianniUser.id, true);
			store.setIsWriting(mockedRoom.id, mockLucaUser.id, true);
			store.setIsWriting(mockedRoom.id, mockQuintoUser.id, true);
		});

		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);

		const isWriting = await screen.findByText(`${mockRobertoUser.name} and 3 others are typing...`);
		expect(isWriting).toBeInTheDocument();
	});
});
