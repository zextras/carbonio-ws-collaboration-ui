/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen, renderHook } from '@testing-library/react';
import { forEach } from 'lodash';

import useBubbleReactions, { ReactionType } from './useBubbleReactions';
import { xmppClient } from '../../../../../network/xmpp/XMPPClient';
import useStore from '../../../../../store/Store';
import {
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../../tests/createMock';
import { ProvidersWrapper, setup } from '../../../../../tests/test-utils';
import { RoomBe } from '../../../../../types/network/models/roomBeTypes';
import { FasteningAction, TextMessage } from '../../../../../types/store/ChatsRegistryTypes';
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
	action: FasteningAction.REACTION,
	originalStanzaId: simpleTextMessage.stanzaId,
	from: sessionUser.id,
	value: ReactionType.THUMBS_UP
});

const iconTestId = 'icon: SmileOutline';

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
	store.addRooms([room]);
	store.newMessage(simpleTextMessage);
});

describe('Bubble Contextual Menu - other user messages', () => {
	test('Dropdown change visibility by clicking on smile icon', async () => {
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user } = setup(result.current.ReactionsPopover);
		const smileButton = screen.getByTestId(iconTestId);
		expect(result.current.reactionsPopoverActive).toBe(false);
		await user.click(smileButton);
		expect(result.current.reactionsPopoverActive).toBe(true);
	});

	test('All reactions are displayed', async () => {
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user, rerender } = setup(result.current.ReactionsPopover);
		const smileButton = screen.getByTestId(iconTestId);
		expect(result.current.reactionsPopoverActive).toBe(false);
		await user.click(smileButton);
		rerender(result.current.ReactionsPopover);
		forEach(ReactionType, (reaction) => {
			const reactionBox = screen.getByTestId(`reaction-${reaction}`);
			expect(reactionBox).toBeInTheDocument();
		});
	});

	test('Send a reaction', async () => {
		const spyOnSendChatMessageReaction = vi.spyOn(xmppClient, 'sendChatMessageReaction');
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user, rerender } = setup(result.current.ReactionsPopover);
		const smileButton = screen.getByTestId(iconTestId);
		expect(result.current.reactionsPopoverActive).toBe(false);
		await user.click(smileButton);

		rerender(result.current.ReactionsPopover);
		const reaction = screen.getByTestId(`reaction-${ReactionType.THUMBS_UP}`);
		await user.click(reaction);

		expect(spyOnSendChatMessageReaction).toHaveBeenCalledTimes(1);
	});

	test('Sent reaction is highlight', async () => {
		const store = useStore.getState();
		const spyOnSendChatMessageReaction = vi.spyOn(xmppClient, 'sendChatMessageReaction');

		store.addFastening([reactionToSimpleTextMessage]);
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user, rerender } = setup(result.current.ReactionsPopover);
		const smileButton = screen.getByTestId(iconTestId);
		expect(result.current.reactionsPopoverActive).toBe(false);
		await user.click(smileButton);

		rerender(result.current.ReactionsPopover);
		const reaction = screen.getByTestId(`reaction-${ReactionType.THUMBS_UP}`);
		expect(reaction).toHaveStyle('background-color: #abc6ed;');
		// Remove reaction
		await user.click(reaction);
		expect(spyOnSendChatMessageReaction).toHaveBeenCalledTimes(1);
	});

	test('Open custom reaction picker', async () => {
		const { result } = renderHook(() => useBubbleReactions(simpleTextMessage), {
			wrapper: ProvidersWrapper
		});
		const { user, rerender } = setup(result.current.ReactionsPopover);
		const smileButton = screen.getByTestId(iconTestId);
		await user.click(smileButton);
		rerender(result.current.ReactionsPopover);
		const customReactionButton = screen.getByTestId('custom-reactions');
		await user.click(customReactionButton);
		rerender(result.current.ReactionsPopover);
		const customReactionPicker = screen.getByTestId('custom-reaction-picker');
		expect(customReactionPicker).toBeInTheDocument();
	});
});
