/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import WritingBubble from './WritingBubble';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import MessagesList from '../MessagesList';

const user1: UserBe = {
	id: 'idDiPaolo',
	email: 'paolo@rossi.it',
	name: 'Paolo Rossi'
};

const user2: UserBe = {
	id: 'idDiRoberto',
	email: 'roberto@baggio.it',
	name: 'Roberto Baggio'
};

const room: RoomBe = createMockRoom({
	id: 'roomNuova',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id })
	]
});

describe('Display is typing list', () => {
	test('Renders the writing bubble with a single user', () => {
		setup(<WritingBubble writingListNames={[user1.name]} />);
		const paoloIsWriting = screen.getByText(/Paolo Rossi is typing/i);
		expect(paoloIsWriting).toBeInTheDocument();
	});

	test('Renders the writing bubble with multiple users', () => {
		setup(<WritingBubble writingListNames={[user1.name, user2.name]} />);
		const paoloIsWriting = screen.getByText(new RegExp(user1.name, 'i'));
		expect(paoloIsWriting).toBeInTheDocument();
		const robertoIsWriting = screen.getByText(new RegExp(user2.name, 'i'));
		expect(robertoIsWriting).toBeInTheDocument();
		const paoloAndRobertoAreWriting = screen.getByText(
			new RegExp(`${user1.name}, ${user2.name} are typing`, 'i')
		);
		expect(paoloAndRobertoAreWriting).toBeInTheDocument();
	});

	test('Renders message list an the writing bubble with a single user passed from the store', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1);
		store.setUserInfo(user2);
		store.setIsWriting(room.id, user1.id, true);
		setup(<MessagesList roomId={room.id} />);
		const paoloIsWriting = screen.getByText(new RegExp(`${user1.name} is typing`, 'i'));
		expect(paoloIsWriting).toBeInTheDocument();
	});
});
