/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ClearHistoryModal from './ClearHistoryModal';
import useStore from '../../../../store/Store';
import { createMockRoom } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';

const mockRoom: RoomBe = createMockRoom({ id: 'roomId' });

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([mockRoom]);
});

describe('Clear history', () => {
	test('Clear history modal should be visible', () => {
		setup(
			<ClearHistoryModal
				roomId={mockRoom.id}
				clearHistoryModalOpen
				closeModal={vi.fn()}
				successfulSnackbar={vi.fn()}
			/>
		);
		const clearHistoryLabel = screen.getAllByText(/Clear History/i);
		expect(clearHistoryLabel[0]).toBeInTheDocument();
		expect(clearHistoryLabel[1]).toBeInTheDocument();
		expect(clearHistoryLabel[1]).not.toBeDisabled();
	});

	test('Clear history modal closing after cleared', async () => {
		const closeModal = vi.fn();

		const { user } = setup(
			<ClearHistoryModal
				roomId={mockRoom.id}
				clearHistoryModalOpen
				closeModal={closeModal}
				successfulSnackbar={vi.fn()}
			/>
		);
		const clearHistoryLabel = screen.getAllByText(/Clear History/i);

		await user.click(clearHistoryLabel[1]);
		expect(closeModal).toHaveBeenCalled();
	});
});
