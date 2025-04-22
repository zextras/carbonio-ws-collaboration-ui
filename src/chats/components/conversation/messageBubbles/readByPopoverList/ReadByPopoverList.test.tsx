/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useRef } from 'react';

import { act, screen } from '@testing-library/react';

import ReadByPopoverList from './ReadByPopoverList';
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
	messageId: textMessage.id,
	from: user1.id,
	markerDate: now - 4000
});
const user2Marker = createMockMarker({
	messageId: textMessage.id,
	from: user2.id,
	markerDate: now - 3000
});
const sessionUserMarker = createMockMarker({
	messageId: textMessage.id,
	from: sessionUser.id,
	markerDate: now - 2000
});

const ComplexComponent = (): ReactElement => {
	const ref = useRef(null);
	return (
		<>
			<div data-testid="clickableDiv" ref={ref} />
			<ReadByPopoverList roomId={room.id} stanzaId={textMessage.stanzaId} anchorRef={ref} />
		</>
	);
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.email);
	store.setUserInfo([user1, user2]);
	store.newMessage(textMessage);
	store.updateReadStatus(room.id, [user1Marker]);
});
describe('ReadByPopoverList test', () => {
	test('Display updating reading user list', async () => {
		const { user } = setup(<ComplexComponent />);
		await user.click(screen.getByTestId('clickableDiv'));
		expect(screen.getByText('User 1')).toBeInTheDocument();
		act(() => {
			useStore.getState().updateReadStatus(room.id, [user2Marker]);
		});
		expect(screen.getByText('User 2')).toBeInTheDocument();
	});

	test('Display all reading except sessionUser', async () => {
		useStore.getState().updateReadStatus(room.id, [sessionUserMarker]);
		const { user } = setup(<ComplexComponent />);
		await user.click(screen.getByTestId('clickableDiv'));
		expect(screen.getByText('User 1')).toBeInTheDocument();
		expect(screen.queryByText(sessionUser.email)).not.toBeInTheDocument();
	});
});
