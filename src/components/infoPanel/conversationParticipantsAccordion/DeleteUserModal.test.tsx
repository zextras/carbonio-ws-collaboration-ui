/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import DeleteUserModal from './DeleteUserModal';

const mockRoom: RoomBe = createMockRoom({ id: 'roomId' });

describe('Delete user modal', () => {
	test('User click the "Remove" button', async () => {
		useStore.getState().addRoom(mockRoom);
		const deleteUser = jest.fn();
		const { user } = setup(
			<DeleteUserModal deleteUser={deleteUser} closeModal={jest.fn} deleteUserModalOpen />
		);
		expect(screen.getByText(/Remove Member/i)).toBeInTheDocument();

		const removeButton = screen.getAllByText(/Remove/i);
		await user.click(removeButton[2]);
		expect(deleteUser).toBeCalled();
	});
});
