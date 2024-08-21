/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { forEach } from 'lodash';

import useBubbleReactions from './useBubbleReactions';
import useStore from '../../../../../store/Store';
import {
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../../tests/createMock';
import { mockedSendChatMessageReaction } from '../../../../../tests/mockedXmppClient';
import { ProvidersWrapper, setup } from '../../../../../tests/test-utils';
import { RoomBe } from '../../../../../types/network/models/roomBeTypes';
import { TextMessage } from '../../../../../types/store/MessageTypes';
import { RootStore } from '../../../../../types/store/StoreTypes';

const sessionUser = createMockUser({ id: 'sesssionId', name: 'sessionName' });
const room: RoomBe = createMockRoom();
const simpleTextMessage: TextMessage = createMockTextMessage({
	roomId: room.id,
	from: sessionUser.id,
	date: Date.now() - 60
});
const reactionToSimpleTextMessage = createMockMessageFastening({
	roomId: room.id,
	action: 'reaction',
	originalStanzaId: simpleTextMessage.stanzaId,
	from: sessionUser.id,
	value: '\uD83D\uDC4D'
});

const iconTestId = 'icon: SmileOutline';

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.name);
	store.addRoom(room);
	store.newMessage(simpleTextMessage);
});

describe('Bubble Contextual Menu - other user messages', () => {
	test('Dropdown change visibility by clicking on smile icon', async () => {
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user } = setup(result.current.ReactionsDropdown);
		const smileButton = screen.getByTestId(iconTestId);
		expect(result.current.reactionsDropdownActive).toBe(false);
		await user.click(smileButton);
		expect(result.current.reactionsDropdownActive).toBe(true);
	});

	test('All reactions are displayed', async () => {
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user } = setup(result.current.ReactionsDropdown);
		const smileButton = screen.getByTestId(iconTestId);
		expect(result.current.reactionsDropdownActive).toBe(false);
		await user.click(smileButton);
		const reactions = [
			'\uD83D\uDC4D',
			'\u2764\uFE0F',
			'\uD83D\uDE02',
			'\uD83D\uDE22',
			'\uD83D\uDC4E'
		];
		forEach(reactions, (reaction) => {
			const reactionBox = screen.getByTestId(`reaction-${reaction}`);
			expect(reactionBox).toBeInTheDocument();
		});
	});

	test('Send a reaction', async () => {
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user } = setup(result.current.ReactionsDropdown);
		const smileButton = screen.getByTestId(iconTestId);
		expect(result.current.reactionsDropdownActive).toBe(false);
		await user.click(smileButton);

		const reaction = screen.getByTestId('reaction-\uD83D\uDC4D');
		await user.click(reaction);

		expect(mockedSendChatMessageReaction).toHaveBeenCalledTimes(1);
	});

	test('Sent reaction is highlight', async () => {
		useStore.getState().addFastening(reactionToSimpleTextMessage);
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user } = setup(result.current.ReactionsDropdown);
		const smileButton = screen.getByTestId(iconTestId);
		expect(result.current.reactionsDropdownActive).toBe(false);
		await user.click(smileButton);

		const reaction = screen.getByTestId('reaction-\uD83D\uDC4D');
		expect(reaction).toHaveStyle('background-color: #96b8e9;');
		// Remove reaction
		await user.click(reaction);
		expect(mockedSendChatMessageReaction).toHaveBeenCalledTimes(1);
	});
});
