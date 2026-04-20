/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import { ConversationView } from './Conversation';
import ConversationHeader from './ConversationHeader';
import { mockUseMediaQueryCheck } from '../../../hooks/__mocks__/useMediaQueryCheck';
import useStore from '../../../store/Store';
import {
	createMockAttributesList,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
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

vi.mock('../../../hooks/useMediaQueryCheck');

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.addRooms([mockedRoom]);
	store.setPlaceholderRoom(mockPaoloUser.id);
});
describe('Conversation header test', () => {
	test('Width of the screen is smaller than 600rem', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(false);
		setup(
			<ConversationHeader
				roomId={mockedRoom.id}
				conversationView={ConversationView.CHAT}
				setConversationView={vi.fn()}
			/>
		);
		const infoIcon = screen.getByTestId('icon: InfoOutline');
		expect(infoIcon).toBeInTheDocument();
	});

	test('Width of the screen is bigger than 60rem', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(true);
		setup(
			<ConversationHeader
				roomId={mockedRoom.id}
				conversationView={ConversationView.CHAT}
				setConversationView={vi.fn()}
			/>
		);
		expect(screen.queryByTestId('icon: InfoOutline')).toBeNull();
	});

	test('Meeting button is displayed when canVideoCall capability is set to true', async () => {
		const store: RootStore = useStore.getState();
		store.setAttributes(createMockAttributesList({ carbonioWscVideoCallEnabled: 'TRUE' }));
		setup(
			<ConversationHeader
				roomId={mockedRoom.id}
				conversationView={ConversationView.CHAT}
				setConversationView={vi.fn()}
			/>
		);
		expect(screen.getByTestId('ConversationHeaderMeetingButton')).toBeInTheDocument();
	});

	test("Meeting button isn't displayed when canVideoCall capability is set to false", async () => {
		const store: RootStore = useStore.getState();
		store.setAttributes(createMockAttributesList({ carbonioWscVideoCallEnabled: 'FALSE' }));
		setup(
			<ConversationHeader
				roomId={mockedRoom.id}
				conversationView={ConversationView.CHAT}
				setConversationView={vi.fn()}
			/>
		);
		expect(screen.queryByTestId('ConversationHeaderMeetingButton')).not.toBeInTheDocument();
	});

	test("Meeting button isn't displayed when the room is a placeholder", async () => {
		const store: RootStore = useStore.getState();
		store.setAttributes(createMockAttributesList({ carbonioWscVideoCallEnabled: 'TRUE' }));
		setup(
			<ConversationHeader
				roomId={`placeholder-${mockPaoloUser.id}`}
				conversationView={ConversationView.CHAT}
				setConversationView={vi.fn()}
			/>
		);
		expect(screen.queryByTestId('ConversationHeaderMeetingButton')).not.toBeInTheDocument();
	});
});

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo({ id: mockPaoloUser.id, name: mockPaoloUser.name });
	store.setUserInfo([mockRobertoUser, mockLucaUser, mockGianniUser, mockQuintoUser]);
	store.addRooms([mockedRoom]);
});
describe('isWriting functionality', () => {
	test('is writing appears when someone is writing and disappear if not', async () => {
		useStore.getState().setIsWriting(mockedRoom.id, mockRobertoUser.id, true);

		setup(
			<ConversationHeader
				roomId={mockedRoom.id}
				conversationView={ConversationView.CHAT}
				setConversationView={vi.fn()}
			/>
		);

		const isWriting = await screen.findByTestId('is_writing_text');
		expect(isWriting).toBeInTheDocument();

		act(() => {
			useStore.getState().setIsWriting(mockedRoom.id, mockRobertoUser.id, false);
			vi.advanceTimersByTime(4000);
		});

		expect(isWriting).not.toBeVisible();
	});

	test('is writing label for four or more users that are writing', async () => {
		const store: RootStore = useStore.getState();
		store.setIsWriting(mockedRoom.id, mockRobertoUser.id, true);
		store.setIsWriting(mockedRoom.id, mockGianniUser.id, true);
		store.setIsWriting(mockedRoom.id, mockLucaUser.id, true);
		store.setIsWriting(mockedRoom.id, mockQuintoUser.id, true);

		setup(
			<ConversationHeader
				roomId={mockedRoom.id}
				conversationView={ConversationView.CHAT}
				setConversationView={vi.fn()}
			/>
		);

		const isWriting = await screen.findByText(`${mockRobertoUser.name} and 3 others are typing...`);
		expect(isWriting).toBeInTheDocument();
	});
});
