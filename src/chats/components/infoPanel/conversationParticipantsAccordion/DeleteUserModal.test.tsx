/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import DeleteUserModal from './DeleteUserModal';
import useStore from '../../../../store/Store';
import { createMockRoom } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';

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
