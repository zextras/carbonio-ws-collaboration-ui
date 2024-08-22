/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { ReactionType } from './bubbleActions/useBubbleReactions';
import MessageReactionsList from './MessageReactionsList';
import useStore from '../../../../store/Store';
import {
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { FasteningAction, TextMessage } from '../../../../types/store/MessageTypes';

const loggedUser = createMockUser({ id: 'loggedUser', name: 'Logged User' });
const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });
const user3 = createMockUser({ id: 'user3', name: 'User 3' });

const room: RoomBe = createMockRoom();
const simpleTextMessage: TextMessage = createMockTextMessage({
	roomId: room.id,
	from: loggedUser.id,
	date: Date.now() - 60
});
const reaction1ToSimpleTextMessage = createMockMessageFastening({
	id: 'reaction1',
	roomId: room.id,
	action: FasteningAction.REACTION,
	originalStanzaId: simpleTextMessage.stanzaId,
	from: user1.id,
	value: ReactionType.THUMBS_UP
});

const reaction2ToSimpleTextMessage = createMockMessageFastening({
	id: 'reaction2',
	roomId: room.id,
	action: FasteningAction.REACTION,
	originalStanzaId: simpleTextMessage.stanzaId,
	from: user2.id,
	value: ReactionType.HEART
});
const reaction3ToSimpleTextMessage = createMockMessageFastening({
	id: 'reaction3',
	roomId: room.id,
	action: FasteningAction.REACTION,
	originalStanzaId: simpleTextMessage.stanzaId,
	from: user3.id,
	value: ReactionType.JOY
});
const reaction4ToSimpleTextMessage = createMockMessageFastening({
	id: 'reaction4',
	roomId: room.id,
	action: FasteningAction.REACTION,
	originalStanzaId: simpleTextMessage.stanzaId,
	from: loggedUser.id,
	value: ReactionType.THUMBS_UP
});

const reactionChipTestId = 'reaction-chip';

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo(loggedUser);
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.addRoom(room);
	store.newMessage(simpleTextMessage);
});

describe('MessageReactionsList', () => {
	test('Message has no reactions', () => {
		setup(<MessageReactionsList roomId={room.id} stanzaId={simpleTextMessage.stanzaId} />);
		const reactionChip = screen.queryAllByTestId(reactionChipTestId);
		expect(reactionChip).toHaveLength(0);
	});

	test('Message has 3 different reactions', () => {
		useStore.getState().addFastening(reaction1ToSimpleTextMessage);
		useStore.getState().addFastening(reaction2ToSimpleTextMessage);
		useStore.getState().addFastening(reaction3ToSimpleTextMessage);
		setup(<MessageReactionsList roomId={room.id} stanzaId={simpleTextMessage.stanzaId} />);
		const reactionChip = screen.queryAllByTestId(reactionChipTestId);
		expect(reactionChip).toHaveLength(3);
	});

	test('The same reaction is sent by 2 user', () => {
		useStore.getState().addFastening(reaction1ToSimpleTextMessage);
		useStore.getState().addFastening(reaction4ToSimpleTextMessage);
		setup(<MessageReactionsList roomId={room.id} stanzaId={simpleTextMessage.stanzaId} />);
		const reactionChip = screen.queryAllByTestId(reactionChipTestId);
		expect(reactionChip).toHaveLength(1);
	});
});
