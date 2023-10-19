/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { ConfigurationMessageLabel } from './ConfigurationMessageLabel';
import useStore from '../store/Store';
import {
	createMockConfigurationMessage,
	createMockMember,
	createMockParticipants,
	createMockRoom
} from '../tests/createMock';
import { setup } from '../tests/test-utils';
import { OperationType } from '../types/store/MessageTypes';

const sessionUser = createMockMember({ userId: 'sessionId' });
const member1 = createMockParticipants({ userId: 'id-1' });
const member2 = createMockParticipants({ userId: 'id-2' });

const room = createMockRoom({ name: 'Group Name', members: [sessionUser, member1, member2] });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.userId, 'User');
	store.setUserInfo({ id: member1.userId, name: 'User 1', email: 'user1@test.it' });
	store.addRoom(room);
});
describe('ConfigurationMessageLabel', () => {
	test('User creates room', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: room.id,
			operation: OperationType.ROOM_CREATION,
			from: sessionUser.userId
		});
		setup(<ConfigurationMessageLabel message={configurationMessage} />);

		expect(screen.getByText(`${room.name} created!`)).toBeInTheDocument();
	});

	test('User changes room name', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: room.id,
			operation: OperationType.ROOM_NAME_CHANGED,
			from: sessionUser.userId,
			value: 'New Group Name'
		});
		setup(<ConfigurationMessageLabel message={configurationMessage} />);

		expect(
			screen.getByText(`{{nameToDisplay}} changed the title of this Group in`)
		).toBeInTheDocument();
	});

	test('User changes topic', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: room.id,
			operation: OperationType.ROOM_DESCRIPTION_CHANGED,
			from: sessionUser.userId,
			value: 'New Group topic'
		});
		setup(<ConfigurationMessageLabel message={configurationMessage} />);

		expect(
			screen.getByText(`{{nameToDisplay}} changed the topic of ${room.name} in`)
		).toBeInTheDocument();
	});

	test('Session user removes topic', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: room.id,
			operation: OperationType.ROOM_DESCRIPTION_CHANGED,
			from: sessionUser.userId,
			value: ''
		});
		setup(<ConfigurationMessageLabel message={configurationMessage} />);

		expect(screen.getByText(`You removed ${room.name}'s topic`)).toBeInTheDocument();
	});

	test('User removes topic', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: room.id,
			operation: OperationType.ROOM_DESCRIPTION_CHANGED,
			from: member1.userId,
			value: ''
		});
		setup(<ConfigurationMessageLabel message={configurationMessage} />);
		const member1Name = useStore.getState().users[member1.userId].name;
		expect(screen.getByText(`${member1Name} removed ${room.name}'s topic`)).toBeInTheDocument();
	});
});
