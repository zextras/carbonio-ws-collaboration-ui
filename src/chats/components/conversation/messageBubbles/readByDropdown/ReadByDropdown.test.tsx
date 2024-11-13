/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import ReadByDropdown from './ReadByDropdown';
import useStore from '../../../../../store/Store';
import {
	createMockMarker,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../../tests/createMock';
import { setup } from '../../../../../tests/test-utils';

const sessionUser = createMockUser({ id: 'sessionUserId' });
const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });

const room = createMockRoom();

const now = Date.now();
const textMessage = createMockTextMessage({
	roomId: room.id,
	stanzaId: 'stanzaId',
	from: sessionUser.id,
	date: now - 5000
});

const user1Marker = createMockMarker({
	roomId: room.id,
	messageId: textMessage.id,
	from: user1.id,
	markerDate: now - 4000
});
const user2Marker = createMockMarker({
	roomId: room.id,
	messageId: textMessage.id,
	from: user2.id,
	markerDate: now - 3000
});
const sessionUserMarker = createMockMarker({
	roomId: room.id,
	messageId: textMessage.id,
	from: sessionUser.id,
	markerDate: now - 2000
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.email);
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.newMessage(textMessage);
	store.updateMarkers(room.id, [user1Marker]);
});
describe('ReadByDropdown test', () => {
	test('Display updating reading user list', () => {
		setup(<ReadByDropdown roomId={room.id} stanzaId={textMessage.stanzaId} />);
		expect(screen.getByText('User 1')).toBeInTheDocument();
		act(() => {
			useStore.getState().updateMarkers(room.id, [user2Marker]);
		});
		expect(screen.getByText('User 2')).toBeInTheDocument();
	});

	test('Display all reading except sessionUser', () => {
		useStore.getState().updateMarkers(room.id, [sessionUserMarker]);
		setup(<ReadByDropdown roomId={room.id} stanzaId={textMessage.stanzaId} />);
		expect(screen.getByText('User 1')).toBeInTheDocument();
		expect(screen.queryByText(sessionUser.email)).not.toBeInTheDocument();
	});
});
