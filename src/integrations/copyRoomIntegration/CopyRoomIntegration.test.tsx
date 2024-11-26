/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import CopyRoomWidget from './CopyRoomWidget';
import { RoomsApi } from '../../network';
import useStore from '../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });
const sessionMember = createMockMember({ id: sessionUser.id, owner: true });
const member1 = createMockMember({ id: 'member1', owner: false });
const member2 = createMockMember({ id: 'member2', owner: false });

describe('CopyRoomIntegration tests', () => {
	test('Chats group has no duplicate group in WSC', () => {
		setup(<CopyRoomWidget name={'test'} members={[]} type="group" />);
		expect(screen.getByText('COPY GROUP')).toBeInTheDocument();
	});

	test('Chats group has duplicate group in WSC', () => {
		useStore
			.getState()
			.addRoom(createMockRoom({ name: 'test', type: 'group', members: [sessionMember] }));
		setup(
			<CopyRoomWidget
				name={'test'}
				members={[
					{
						userId: sessionMember.userId,
						owner: sessionMember.owner
					}
				]}
				type="group"
			/>
		);
		expect(screen.getByText('VIEW IN NEW CHATS MODULE')).toBeInTheDocument();
	});

	test('Duplicate Chats group in WSC', async () => {
		const addRoom = jest.spyOn(RoomsApi, 'addRoom').mockResolvedValue(createMockRoom());

		const { user } = setup(
			<CopyRoomWidget
				name={'test'}
				members={[
					{
						userId: sessionMember.userId,
						owner: sessionMember.owner
					},
					{
						userId: member1.userId,
						owner: member1.owner
					},
					{
						userId: member2.userId,
						owner: member2.owner
					}
				]}
				type="group"
			/>
		);
		const copyGroupButton = screen.getByText('COPY GROUP');
		await user.click(copyGroupButton);
		const continueButton = screen.getByText('CONTINUE');
		expect(continueButton).toBeInTheDocument();
		await user.click(continueButton);
		expect(addRoom).toHaveBeenCalled();
	});
});
