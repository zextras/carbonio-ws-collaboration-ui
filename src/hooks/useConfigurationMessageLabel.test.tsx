/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import {
	ConfigurationMessageLabel,
	useConfigurationMessageLabel
} from './useConfigurationMessageLabel';
import useStore from '../store/Store';
import {
	createMockConfigurationMessage,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../tests/createMock';
import { ProvidersWrapper, setup } from '../tests/test-utils';
import { OperationType } from '../types/store/MessageTypes';

const sessionUser = createMockUser({ userId: 'sessionId', name: 'User' });
const user1 = createMockUser({
	id: 'id-1',
	name: 'User 1',
	email: 'user1@test.it'
});
const member1 = createMockMember({ userId: user1.id });
const member2 = createMockMember({ userId: 'id-2' });

const room = createMockRoom({ name: 'Group Name', members: [sessionUser, member1, member2] });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.name);
	store.setUserInfo(sessionUser);
	store.setUserInfo(user1);
	store.addRoom(room);
});

describe('useConfigurationMessageLabel', () => {
	test('User creates room', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: room.id,
			operation: OperationType.ROOM_CREATION,
			from: sessionUser.id
		});
		setup(<ConfigurationMessageLabel message={configurationMessage} />);

		expect(screen.getByText(`${room.name} created!`)).toBeInTheDocument();
	});

	test('Session user removes topic', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: room.id,
			operation: OperationType.ROOM_DESCRIPTION_CHANGED,
			from: sessionUser.id,
			value: ''
		});
		const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
			wrapper: ProvidersWrapper
		});
		expect(result.current).toBe(`You removed ${room.name}'s topic.`);
	});

	test('User removes topic', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: room.id,
			operation: OperationType.ROOM_DESCRIPTION_CHANGED,
			from: member1.userId,
			value: ''
		});
		const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
			wrapper: ProvidersWrapper
		});
		expect(result.current).toBe(`User 1 removed ${room.name}'s topic.`);
	});
});
