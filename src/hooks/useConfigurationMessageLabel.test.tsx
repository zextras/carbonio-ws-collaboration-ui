/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, renderHook } from '@testing-library/react';

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
import { RoomType } from '../types/store/RoomTypes';

const loggedUser = createMockUser({ userId: 'loggedUserId', name: 'Logged User' });
const user1 = createMockUser({ id: 'id-1', name: 'User 1' });
const user2 = createMockUser({ id: 'id-2' });

const groupRoom = createMockRoom({
	id: 'groupRoomId',
	name: 'Group Room Name',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: loggedUser.id }),
		createMockMember({ userId: user1.id }),
		createMockMember({ userId: user2.id })
	]
});
const oneToOneRoom = createMockRoom({
	id: 'oneToOneRoomId',
	name: 'OneToOne Room Name',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: loggedUser.id }), createMockMember({ userId: user1.id })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo(loggedUser);
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.addRoom(groupRoom);
	store.addRoom(oneToOneRoom);
});
describe('useConfigurationMessageLabel', () => {
	describe('Change room name and topic labels', () => {
		test('Logged user changes room name', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_NAME_CHANGED,
				from: loggedUser.id,
				value: 'new name'
			});
			setup(<ConfigurationMessageLabel message={configurationMessage} />);
			const label = screen.getByText(/You changed the title of this Group in.\./i);
			expect(label).toBeInTheDocument();
		});

		test('A member changes room name', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_NAME_CHANGED,
				from: user1.id,
				value: 'new name'
			});
			setup(<ConfigurationMessageLabel message={configurationMessage} />);
			const label = screen.getByText(/User 1 changed the title of this Group in.\./i);
			expect(label).toBeInTheDocument();
		});

		test('Logged user changes room topic', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_DESCRIPTION_CHANGED,
				from: loggedUser.id,
				value: 'topic changed'
			});
			setup(<ConfigurationMessageLabel message={configurationMessage} />);
			const label = screen.getByText(/You changed the topic of group room name in ""\./i);
			expect(label).toBeInTheDocument();
		});

		test('A member changes room topic', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_DESCRIPTION_CHANGED,
				from: user1.id,
				value: 'topic changed'
			});
			setup(<ConfigurationMessageLabel message={configurationMessage} />);
			const label = screen.getByText(/user 1 changed the topic of group room name in ""\./i);
			expect(label).toBeInTheDocument();
		});

		test('Logged user removes room topic', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_DESCRIPTION_CHANGED,
				from: loggedUser.id,
				value: ''
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`You removed ${groupRoom.name}'s topic.`);
		});

		test('A member removes room topic', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_DESCRIPTION_CHANGED,
				from: user1.id,
				value: ''
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`${user1.name} removed ${groupRoom.name}'s topic.`);
		});
	});

	describe('Change room picture labels', () => {
		test('Logged user updates room picture', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_PICTURE_UPDATED,
				from: loggedUser.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`You changed ${groupRoom.name}'s image.`);
		});

		test('A member updates room picture', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_PICTURE_UPDATED,
				from: user1.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`${user1.name} changed ${groupRoom.name}'s image.`);
		});

		test('Logged user removes room picture', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_PICTURE_DELETED,
				from: loggedUser.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`You have restored the default ${groupRoom.name}'s image.`);
		});

		test('A member removes room picture', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_PICTURE_DELETED,
				from: user1.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`${user1.name} restored the default ${groupRoom.name}'s image.`);
		});
	});

	describe('Member affiliation labels', () => {
		test('Logged user is added to room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.MEMBER_ADDED,
				from: user1.id,
				value: loggedUser.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`You have been added to ${groupRoom.name}.`);
		});

		test('A member is added to room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.MEMBER_ADDED,
				from: loggedUser.id,
				value: user1.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`${user1.name} has been added to ${groupRoom.name}.`);
		});

		test('Logged user is removed from room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.MEMBER_REMOVED,
				from: user1.id,
				value: loggedUser.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`You are no longer a member of ${groupRoom.name}.`);
		});

		test('A member is removed from room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.MEMBER_REMOVED,
				from: loggedUser.id,
				value: user1.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`${user1.name} is no longer a member of ${groupRoom.name}.`);
		});

		test('A member with no user info is added to room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.MEMBER_ADDED,
				from: loggedUser.id,
				value: 'unknownUserId'
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(undefined);
		});

		test('A member with no user info is removed from room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.MEMBER_REMOVED,
				from: loggedUser.id,
				value: 'unknownUserId'
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(undefined);
		});
	});

	describe('Room creation labels', () => {
		test('Logged user creates one-to-one room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: oneToOneRoom.id,
				operation: OperationType.MEMBER_ADDED,
				from: loggedUser.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`New Chat created!`);
		});

		test('A member creates one-to-one room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: oneToOneRoom.id,
				operation: OperationType.MEMBER_ADDED,
				from: user1.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`New Chat created!`);
		});

		test('Logged user creates group room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_CREATION,
				from: loggedUser.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`${groupRoom.name} created!`);
		});

		test('A member creates group room', () => {
			const configurationMessage = createMockConfigurationMessage({
				roomId: groupRoom.id,
				operation: OperationType.ROOM_CREATION,
				from: user1.id
			});
			const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
				wrapper: ProvidersWrapper
			});
			expect(result.current).toBe(`${groupRoom.name} created!`);
		});
	});

	test('Undefined operation type', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation();
		const configurationMessage = createMockConfigurationMessage({
			roomId: groupRoom.id,
			operation: 'unknownOperation'
		});
		const { result } = renderHook(() => useConfigurationMessageLabel(configurationMessage), {
			wrapper: ProvidersWrapper
		});
		expect(result.current).toBe(undefined);
		expect(warn).toHaveBeenCalledWith('Configuration message to replace: ', 'unknownOperation');
	});

	test('ConfigurationMessageLabel component', () => {
		const configurationMessage = createMockConfigurationMessage({
			roomId: groupRoom.id,
			operation: OperationType.ROOM_CREATION,
			from: loggedUser.id
		});
		setup(<ConfigurationMessageLabel message={configurationMessage} />);
		expect(screen.getByText(`${groupRoom.name} created!`)).toBeInTheDocument();
	});
});
