/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { noop } from 'lodash';

import CreateVirtualRoomModal from './CreateVirtualRoomModal';
import useStore from '../../../../store/Store';
import { createMockAttributesList, createMockUser } from '../../../../tests/createMock';
import { RoomsApiToSpy, spyOnRoomsApi } from '../../../../tests/mocks/network';
import { mockSearchUsersByFeatureRequest } from '../../../../tests/mocks/SearchUsersByFeature';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { ContactInfo } from '../../../../types/network/soap/searchUsersByFeatureRequest';

const virtualRoomName = 'New Virtual Room';
const virtualRoomNamePlaceholder = 'Virtual Room’s name*';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });

const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });

// Mock objects
const contactUser1: ContactInfo = {
	email: 'user1@test.com',
	displayName: 'User One',
	id: 'user1-id'
};

const contactUser2: ContactInfo = {
	email: 'user2@test.com',
	displayName: 'User Two',
	id: 'user2-id'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.name);
	store.setUserInfo([user1, user2]);
	store.setAttributes(createMockAttributesList());
});

describe('VirtualRoomsModal', () => {
	test('Try to create a room without a name', async () => {
		const { user } = setup(
			<CreateVirtualRoomModal
				toggleModal={noop}
				showCreationModal
				setShowCreationModal={noop}
				createModalRef={React.createRef<HTMLDivElement>()}
			/>
		);

		const modalTitle = await screen.findByText('Create new Virtual Room');
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByRole('textbox', { name: virtualRoomNamePlaceholder });

		await user.type(textArea, 'a{backspace}');

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeDisabled();
	});

	test('Try to create a room without a name too long', async () => {
		const { user } = setup(
			<CreateVirtualRoomModal
				toggleModal={noop}
				showCreationModal
				setShowCreationModal={noop}
				createModalRef={React.createRef<HTMLDivElement>()}
			/>
		);

		const textArea = await screen.findByRole('textbox', { name: virtualRoomNamePlaceholder });

		await user.type(
			textArea,
			'Lorem dolo ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
		);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeDisabled();
	});

	test('create virtual room with 2 moderators', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1, contactUser2]);

		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);
		const { user } = setup(
			<CreateVirtualRoomModal
				toggleModal={noop}
				showCreationModal
				setShowCreationModal={noop}
				createModalRef={React.createRef<HTMLDivElement>()}
				onChangeVirtualRoom={() => {}}
			/>
		);

		const textArea = await screen.findByRole('textbox', { name: virtualRoomNamePlaceholder });

		await user.type(textArea, virtualRoomName);

		const chipContactOne = await screen.findByText('User One');
		const chipContactTwo = await screen.findByText('User Two');

		await user.click(chipContactOne);
		await user.click(chipContactTwo);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalledWith({
			name: virtualRoomName,
			type: RoomType.TEMPORARY,
			members: [
				{ userId: contactUser1.id, owner: true },
				{ userId: contactUser2.id, owner: true }
			]
		});
	});

	test('create virtual room by selecting and removing one moderator', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1, contactUser2]);

		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);
		const { user } = setup(
			<CreateVirtualRoomModal
				toggleModal={noop}
				showCreationModal
				setShowCreationModal={noop}
				createModalRef={React.createRef<HTMLDivElement>()}
			/>
		);

		const textArea = await screen.findByRole('textbox', { name: virtualRoomNamePlaceholder });

		await user.type(textArea, virtualRoomName);

		const chipContactOne = await screen.findByText('User One');
		const chipContactTwo = await screen.findByText('User Two');

		await user.click(chipContactOne);
		await user.click(chipContactTwo);

		// removing chip
		await user.click(chipContactOne);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalledWith({
			name: virtualRoomName,
			type: RoomType.TEMPORARY,
			members: [{ userId: contactUser2.id, owner: true }]
		});
	});

	test('create virtual room by typing one moderator name', async () => {
		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);
		const { user } = setup(
			<CreateVirtualRoomModal
				toggleModal={noop}
				showCreationModal
				setShowCreationModal={noop}
				createModalRef={React.createRef<HTMLDivElement>()}
			/>
		);

		const textArea = await screen.findByRole('textbox', { name: virtualRoomNamePlaceholder });
		await user.type(textArea, virtualRoomName);

		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1]);
		const moderatorInput = await screen.findByTestId('chip_input_contact_selector');
		await user.type(moderatorInput, 'User One');

		const chipContactOne = await screen.findByText('User One');
		await user.click(chipContactOne);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalledWith({
			name: virtualRoomName,
			type: RoomType.TEMPORARY,
			members: [{ userId: contactUser1.id, owner: true }]
		});
	});

	test('Search user fails ', async () => {
		jest.spyOn(console, 'error').mockImplementation();
		mockSearchUsersByFeatureRequest.mockRejectedValueOnce({ error: 'error' });
		setup(
			<CreateVirtualRoomModal
				toggleModal={noop}
				showCreationModal
				setShowCreationModal={noop}
				createModalRef={React.createRef<HTMLDivElement>()}
			/>
		);

		const noResults = await screen.findByText(
			'There are no items that match this search in your company.'
		);
		expect(noResults).toBeInTheDocument();

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeDisabled();
	});

	test('Search user returns no matches', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([]);
		const { user } = setup(
			<CreateVirtualRoomModal
				toggleModal={noop}
				showCreationModal
				setShowCreationModal={noop}
				createModalRef={React.createRef<HTMLDivElement>()}
			/>
		);

		const moderatorInput = await screen.findByTestId('chip_input_contact_selector');
		await user.type(moderatorInput, 'User');

		const noMatch = await screen.findByText(
			'There are no items that match this search in your company.'
		);
		expect(noMatch).toBeInTheDocument();

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeDisabled();
	});
});
