/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import ParticipantElement from './ParticipantElement';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockUser } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { UserType } from '../../../types/store/UserTypes';

const loggedUser = createMockUser();
const internalUser = createMockUser();
const externalUser = createMockUser({ type: UserType.GUEST });
const activeMeeting = createMockMeeting({});

beforeEach(() => {
	const store = useStore.getState();
	store.addMeeting(activeMeeting);
	store.setLoginInfo(loggedUser.id, loggedUser.name, loggedUser.type);
});

describe('ParticipantElement', () => {
	test('Internal user in meeting', async () => {
		act(() => {
			const store = useStore.getState();
			store.setUserInfo(internalUser);
		});

		setup(
			<ParticipantElement memberId={internalUser.id} meetingId={activeMeeting.id} isInsideMeeting />
		);

		const usernameLabel = await screen.findByText(internalUser.name);
		expect(usernameLabel).toBeVisible();
		const guestLabel = screen.queryByText('Guest');
		expect(guestLabel).not.toBeInTheDocument();
	});

	test('External user in meeting', async () => {
		act(() => {
			const store = useStore.getState();
			store.setUserInfo(externalUser);
		});

		setup(
			<ParticipantElement memberId={externalUser.id} meetingId={activeMeeting.id} isInsideMeeting />
		);

		const usernameLabel = await screen.findByText(externalUser.name);
		expect(usernameLabel).toBeVisible();
		const guestLabel = screen.queryByText('Guest');
		expect(guestLabel).toBeVisible();
		const externalAvatar = screen.getByTestId('icon: SmileOutline');
		expect(externalAvatar).toBeVisible();
	});
});
