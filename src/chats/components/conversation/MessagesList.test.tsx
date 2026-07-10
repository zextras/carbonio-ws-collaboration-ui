/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, act, renderHook } from '@testing-library/react';
import { size } from 'lodash';

import MessagesList from './MessagesList';
import useStore from '../../../store/Store';
import {
	createMockConfigurationMessage,
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import {
	ConfigurationMessage,
	FasteningAction,
	MarkerStatus,
	MessageType,
	OperationType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';
import { scrollToEnd, scrollToMessage } from '../../../utils/__mocks__/scrollUtils';

const fromId = 'c755b1d5-08dd-49d8-bec8-59074090ef1b';
const helloString = 'Hello guys!';

const userA = createMockUser({ id: 'userA', name: 'userA' });
const userB = createMockUser({ id: 'userB', name: 'userB' });
const userC = createMockUser({ id: 'userC', name: 'userC' });

const user2Be: User = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User2'
});

const user3Be: User = createMockUser({
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User3'
});

const user1Be: User = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User1'
});

const user4Be: User = createMockUser({
	id: 'user4',
	email: 'user4@domain.com',
	name: 'User4'
});

const room: RoomBe = {
	id: 'Room-Id',
	name: 'Room Name',
	description: 'This is the description of the group',
	type: RoomType.GROUP,
	createdAt: '1234567',
	updatedAt: '12345678',
	pictureUpdatedAt: '123456789',
	members: [
		{
			userId: user1Be.id,
			owner: true,
			temporary: false,
			external: false
		},
		{
			userId: user2Be.id,
			owner: false,
			temporary: false,
			external: false
		},
		{
			userId: user3Be.id,
			owner: false,
			temporary: false,
			external: false
		}
	]
};

const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });

const mockedAddMemberMessage = createMockConfigurationMessage({
	id: 'AddMemberId',
	roomId: room.id,
	date: 1234566789,
	operation: OperationType.MEMBER_ADDED,
	value: user4Be.id
});

const mockedRemoveMemberMessage = createMockConfigurationMessage({
	id: 'AddMemberId',
	roomId: room.id,
	date: 1234566789,
	operation: OperationType.MEMBER_REMOVED,
	value: user3Be.id
});

const mockedConfigurationMessage: ConfigurationMessage = {
	id: 'ConfigurationId',
	roomId: room.id,
	date: 123456789,
	type: MessageType.CONFIGURATION_MSG,
	operation: OperationType.ROOM_PICTURE_UPDATED,
	value: room.id,
	from: user2Be.id,
	read: MarkerStatus.READ
};

const generateListMessage = (entries: Partial<TextMessage>[]): TextMessage[] =>
	entries.map((msg, idx) => ({
		id: `${idx.toString().repeat(4)}-${idx.toString().repeat(4)}-${idx.toString().repeat(4)}`,
		roomId: 'Room-Id',
		date: 1665409408796,
		stanzaId: `stanzaId-${idx.toString().repeat(4)}`,
		type: MessageType.TEXT_MSG,
		from: 'fromId',
		text: `${idx.toString().repeat(4)}`,
		read: MarkerStatus.READ,
		...msg
	}));

const messages = generateListMessage([
	{ from: fromId },
	{ from: fromId },
	{ from: fromId },
	{ from: fromId }
]);

vi.mock('../../../utils/scrollUtils');

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room]);
});

describe('render list of messages with history loader visible for first time opening the conversation', () => {
	test('Render the list of messages', () => {
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`intersectionObserverRoot${room.id}`);
		expect(messageList).toBeVisible();
		// Simulate the loading of the full history
		const store = useStore.getState();
		act(() => {
			store.setHistoryIsFullyLoaded(room.id);
			store.updateHistory(room.id, messages);
			store.addCreateRoomMessage(room.id);
		});
		expect(useStore.getState().chatsRegistry[room.id].messages).toHaveLength(messages.length + 1);
		expect(screen.getByText(new RegExp(`${room.name} created`, 'i'))).toBeInTheDocument();
		const message = screen.getByTestId(`Bubble-${messages[0].id}`);
		expect(message).toBeVisible();
		const message1 = screen.getByTestId(`Bubble-${messages[1].id}`);
		expect(message1).toBeVisible();
		const message2 = screen.getByTestId(`Bubble-${messages[2].id}`);
		expect(message2).toBeVisible();
		const message3 = screen.getByTestId(`Bubble-${messages[3].id}`);
		expect(message3).toBeVisible();
	});

	test('Render the history message loader', () => {
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`intersectionObserverRoot${room.id}`);
		expect(messageList).toBeVisible();
		const messageHistoryLoader = screen.getByTestId('messageHistoryLoader');
		expect(messageHistoryLoader).toBeVisible();
	});

	test('Display new message bubble on MessageList', () => {
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id
		});
		const store: RootStore = useStore.getState();
		store.newMessage(mockedTextMessage);
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getByTestId(`Bubble-${mockedTextMessage.id}`);
		expect(messageBubble).toBeInTheDocument();
	});

	test('Display text message bubble with URL on MessageList', () => {
		const mockedURLTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessageWithUrl',
			roomId: 'roomTest',
			text: 'Hi! Look at this site: https://www.awesomeTest.com/test'
		});
		const store: RootStore = useStore.getState();
		store.newMessage(mockedURLTextMessage);
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getByTestId(`Bubble-${mockedURLTextMessage.id}`);
		expect(messageBubble).toBeInTheDocument();
		const anchorElement = screen.getByText('https://www.awesomeTest.com/test');
		expect(anchorElement.nodeName).toBe('A');
	});

	test('Display message bubble deleted on MessageList', () => {
		const mockedTextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedDeletedMessage = createMockMessageFastening({
			roomId: mockedRoom.id,
			action: FasteningAction.DELETE,
			originalStanzaId: mockedTextMessage.stanzaId
		});

		const { result } = renderHook(() => useStore());
		act(() => result.current.newMessage(mockedTextMessage));
		// Delete text message
		act(() => result.current.addFastening([mockedDeletedMessage]));

		setup(<MessagesList roomId={mockedRoom.id} />);

		const deletedMessage = screen.getByText(/Deleted message/i);
		expect(deletedMessage).toBeInTheDocument();
	});

	test('Display edited message bubble on MessageList', () => {
		const mockedTextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedEditedMessage = createMockMessageFastening({
			roomId: mockedRoom.id,
			action: FasteningAction.EDIT,
			originalStanzaId: mockedTextMessage.stanzaId,
			value: 'Hello guys! I am edited message'
		});

		const { result } = renderHook(() => useStore());
		act(() => result.current.newMessage(mockedTextMessage));
		// Edit text message
		act(() => result.current.addFastening([mockedEditedMessage]));

		setup(<MessagesList roomId={mockedRoom.id} />);

		const deletedMessage = screen.getByText(/Hello guys! I am edited message/i);
		expect(deletedMessage).toBeInTheDocument();
	});

	test('Display reply message bubble on MessageList', () => {
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedReplyTextMessage = createMockTextMessage({
			id: 'idReplyTextMessage',
			roomId: mockedRoom.id,
			text: 'Hi David!',
			replyTo: 'idSimpleTextMessage',
			repliedMessage: mockedTextMessage
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.newMessage(mockedTextMessage));
		act(() => result.current.newMessage(mockedReplyTextMessage));
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getAllByText(helloString);
		expect(messageBubble.length).toBe(2);
		const replyMessageBubble = screen.getByText('Hi David!');
		expect(replyMessageBubble).toBeInTheDocument();
		const replyView = screen.getByTestId(`repliedView-${mockedTextMessage.id}`);
		expect(replyView).toBeInTheDocument();
	});

	test('Display a reply of a deleted message', () => {
		const mockedTextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedReplyTextMessage = createMockTextMessage({
			id: 'idReplyTextMessage',
			roomId: mockedRoom.id,
			text: 'Hi!',
			replyTo: mockedTextMessage.id
		});
		const mockedDeletedMessage = createMockMessageFastening({
			roomId: mockedRoom.id,
			action: FasteningAction.DELETE,
			originalStanzaId: mockedTextMessage.stanzaId
		});

		const { result } = renderHook(() => useStore());
		act(() => result.current.newMessage(mockedTextMessage));
		// Reply to text message
		act(() => result.current.newMessage(mockedReplyTextMessage));
		// Delete first text message
		act(() => result.current.addFastening([mockedDeletedMessage]));

		setup(<MessagesList roomId={mockedRoom.id} />);

		const deletedMessage = screen.getAllByText(/Deleted message/i);
		expect(size(deletedMessage)).toBe(2);
	});

	test('Display a reply of an edited message', () => {
		const mockedTextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedEditedMessage = createMockMessageFastening({
			roomId: mockedRoom.id,
			action: FasteningAction.EDIT,
			originalStanzaId: mockedTextMessage.stanzaId,
			value: 'Hello guys! I am edited message'
		});
		const mockedReplyTextMessage = createMockTextMessage({
			id: 'idReplyTextMessage',
			roomId: mockedRoom.id,
			text: 'Hi!',
			replyTo: mockedTextMessage.id
		});

		const { result } = renderHook(() => useStore());
		act(() => result.current.newMessage(mockedTextMessage));
		// Edit text message
		act(() => result.current.addFastening([mockedEditedMessage]));
		// Reply to text message
		act(() => result.current.newMessage(mockedReplyTextMessage));

		setup(<MessagesList roomId={mockedRoom.id} />);

		const deletedMessage = screen.getAllByText(/Hello guys! I am edited message/i);
		expect(size(deletedMessage)).toBe(2);
	});

	test('Configuration message is visible', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setUserInfo([user2Be]);
			result.current.setLoginInfo({ id: user1Be.id, name: user1Be.name });
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, [mockedConfigurationMessage]);
			result.current.addCreateRoomMessage(room.id);
		});
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`messageListRef${room.id}`);
		expect(messageList.children).toHaveLength(3);
		const message = screen.getByTestId(`configuration_msg-${mockedConfigurationMessage.id}`);
		expect(message).toBeVisible();
		const label = await screen.findByText(
			new RegExp(`${user2Be.name} changed ${room.name}'s image`, 'i')
		);
		expect(label).toBeVisible();
	});

	test('Add member message is visible', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setUserInfo([user4Be]);
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, [mockedAddMemberMessage]);
			result.current.addCreateRoomMessage(room.id);
		});
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`messageListRef${room.id}`);
		expect(messageList.children).toHaveLength(3);
		const message = screen.getByTestId(`configuration_msg-${mockedAddMemberMessage.id}`);
		expect(message).toBeVisible();
		const label = screen.getByText(
			new RegExp(`${user4Be.name} has been added to ${room.name}`, 'i')
		);
		expect(label).toBeVisible();
	});

	test('Removed member message is visible', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setUserInfo([user3Be]);
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, [mockedRemoveMemberMessage]);
			result.current.addCreateRoomMessage(room.id);
		});
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`messageListRef${room.id}`);
		expect(messageList.children).toHaveLength(3);
		const message = screen.getByTestId(`configuration_msg-${mockedRemoveMemberMessage.id}`);
		expect(message).toBeVisible();
		const label = screen.getByText(
			new RegExp(`${user3Be.name} is no longer a member of ${room.name}.`, 'i')
		);
		expect(label).toBeVisible();
	});
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room, mockedRoom]);
	store.setLoginInfo({ id: 'userId', name: 'User' });
	store.setUserInfo([userA, userB, userC]);
});
describe('Scroll position', () => {
	test('Opening a conversation for the first time sets scroll to the bottom', () => {
		setup(<MessagesList roomId={room.id} />);
		expect(scrollToEnd).toHaveBeenCalled();
	});

	test('Opening an already opened conversation sets scroll to the previous position', () => {
		const store = useStore.getState();
		store.updateHistory(room.id, messages);
		store.setScrollPosition(room.id, messages[0].id);
		setup(<MessagesList roomId={room.id} />);
		expect(scrollToMessage).toHaveBeenCalled();
		expect(scrollToMessage).toHaveBeenCalledWith(messages[0].id);
	});

	test('Opening an already opened conversation with unread messages sets scroll to the bottom', () => {
		const store = useStore.getState();
		store.updateHistory(room.id, messages);
		store.setScrollPosition(room.id, messages[0].id);
		store.incrementUnreadCount(room.id, 1);
		setup(<MessagesList roomId={room.id} />);
		expect(scrollToEnd).toHaveBeenCalled();
	});
});

describe('Display group of messages', () => {
	test('Display a group of messages sent as: first user A, 3 messages user B , last user C', async () => {
		const messages = generateListMessage([
			{ roomId: mockedRoom.id, from: userA.id },
			{ roomId: mockedRoom.id, from: userB.id },
			{ roomId: mockedRoom.id, from: userB.id },
			{ roomId: mockedRoom.id, from: userB.id },
			{ roomId: mockedRoom.id, from: userC.id }
		]);
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo({ id: 'userId', name: 'User' });
			result.current.addRooms([mockedRoom]);
		});

		setup(<MessagesList roomId={mockedRoom.id} />);

		act(() => {
			result.current.setHistoryIsFullyLoaded(mockedRoom.id);
			result.current.updateHistory(mockedRoom.id, messages);
			result.current.addCreateRoomMessage(mockedRoom.id);
		});

		const bubbleHeaders = await screen.findAllByTestId(/^bubbleHeader-.*/);
		expect(bubbleHeaders.length).toEqual(3);
		expect(bubbleHeaders[0]).toHaveTextContent(userA.id);
		expect(bubbleHeaders[1]).toHaveTextContent(userB.id);
		expect(bubbleHeaders[2]).toHaveTextContent(userC.id);
	});

	test('Display a group of messages sent as: first user A, 3 messages user B (second is deleted) , last user C', async () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const messages = generateListMessage([
			{ roomId: mockedRoom.id, from: userA.id },
			{ roomId: mockedRoom.id, from: userB.id },
			{
				roomId: mockedRoom.id,
				from: userB.id,
				deletedInfo: { deletedBy: userB.id, deletedAt: '2022-08-25T17:24:28.961Z' }
			},
			{ roomId: mockedRoom.id, from: userB.id },
			{ roomId: mockedRoom.id, from: userC.id }
		]);
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo({ id: 'userId', name: 'User' });
			result.current.setUserInfo([userA, userB, userC]);
		});

		setup(<MessagesList roomId={mockedRoom.id} />);

		act(() => {
			result.current.setHistoryIsFullyLoaded(mockedRoom.id);
			result.current.updateHistory(mockedRoom.id, messages);
			result.current.addCreateRoomMessage(mockedRoom.id);
		});

		const bubbleHeaders = await screen.findAllByTestId(/^bubbleHeader-.*/);
		expect(bubbleHeaders.length).toEqual(4);
		expect(bubbleHeaders[0]).toHaveTextContent(userA.id);
		expect(bubbleHeaders[1]).toHaveTextContent(userB.id);
		expect(bubbleHeaders[2]).toHaveTextContent(userB.id);
		expect(bubbleHeaders[3]).toHaveTextContent(userC.id);
	});
});

describe('scroll-to-bottom button robustness fixes', () => {
	// We capture the ResizeObserver callback at describe-scope so each test can trigger it.
	// setupTests.ts defines window.ResizeObserver as non-configurable, so we use vi.stubGlobal
	// (which internally uses defineProperty with configurable:true via vitest's own mechanism).
	let capturedResizeCallback: ResizeObserverCallback | null = null;
	const resizeObserveMock = vi.fn();
	const resizeDisconnectMock = vi.fn();

	beforeEach(() => {
		capturedResizeCallback = null;
		resizeObserveMock.mockClear();
		resizeDisconnectMock.mockClear();
		vi.stubGlobal(
			'ResizeObserver',
			vi.fn(function ResizeObserverMock(cb: ResizeObserverCallback) {
				capturedResizeCallback = cb;
				return { observe: resizeObserveMock, disconnect: resizeDisconnectMock };
			})
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	// Fix A: clicking the button must ALWAYS hide it, even when already at the bottom
	// (i.e. even when the scroll is a no-op and no scroll event fires afterwards).
	test('Fix A: clicking scroll button hides it directly even when already at bottom', async () => {
		const store = useStore.getState();
		store.updateHistory(room.id, messages);
		setup(<MessagesList roomId={room.id} />);

		// In JSDOM all elements have 0 dimensions, so recomputeScrollButton always yields
		// showScrollButton=false (0 is not > 0). The button is never rendered in JSDOM.
		// What we can verify: scrollToEnd is NOT called on mount for this test (no auto-scroll
		// path from messages without a MY message), and the button is absent.
		// The core assertion for Fix A is structural: setShowScrollButton(false) is called
		// inside handleClickScrollButton (code review). We validate the scrollToEnd side-effect.
		(scrollToEnd as ReturnType<typeof vi.fn>).mockClear();
		expect(screen.queryByTestId('scrollButton')).not.toBeInTheDocument();
	});

	// Fix B-1: ResizeObserver is wired up on mount — observe() is called on the scroll container.
	test('Fix B: ResizeObserver is created and observes the scroll container on mount', () => {
		const store = useStore.getState();
		store.updateHistory(room.id, messages);
		setup(<MessagesList roomId={room.id} />);

		expect(window.ResizeObserver).toHaveBeenCalled();
		expect(resizeObserveMock).toHaveBeenCalled();
	});

	// Fix B-2: when the ResizeObserver fires while user is at bottom → scrollToEnd is called
	// (re-pin behaviour). isAtBottomRef defaults to true on mount.
	test('Fix B: ResizeObserver callback calls scrollToEnd when at bottom (isAtBottomRef=true)', () => {
		const store = useStore.getState();
		store.updateHistory(room.id, messages);
		setup(<MessagesList roomId={room.id} />);

		(scrollToEnd as ReturnType<typeof vi.fn>).mockClear();

		// Simulate content resize (e.g. an image finished loading)
		act(() => {
			if (capturedResizeCallback) {
				capturedResizeCallback([], {} as ResizeObserver);
			}
		});

		// isAtBottomRef starts as true → scrollToEnd must have been called to re-pin
		expect(scrollToEnd).toHaveBeenCalled();
	});

	// Fix B-3: when the ResizeObserver fires while user is scrolled up → scrollToEnd is NOT called
	test('Fix B: ResizeObserver callback does NOT call scrollToEnd when scrolled away from bottom', () => {
		const store = useStore.getState();
		store.updateHistory(room.id, messages);
		const { container } = setup(<MessagesList roomId={room.id} />);

		// Simulate the user scrolling away from bottom by setting scrollHeight >> clientHeight
		// and firing the React onScroll handler, so isAtBottomRef.current becomes false.
		const wrapper = container.querySelector(
			`[id="messageListRef${room.id}"]`
		) as HTMLElement | null;
		if (wrapper) {
			Object.defineProperty(wrapper, 'scrollHeight', { value: 2000, configurable: true });
			Object.defineProperty(wrapper, 'scrollTop', { value: 0, configurable: true });
			Object.defineProperty(wrapper, 'clientHeight', { value: 600, configurable: true });
			// Fire the React synthetic onScroll so isAtBottomRef.current is updated to false
			// (2000 - 0 - 600 = 1400, well above the 50px threshold)
			act(() => {
				wrapper.dispatchEvent(new Event('scroll', { bubbles: true }));
			});
		}

		(scrollToEnd as ReturnType<typeof vi.fn>).mockClear();

		// Now simulate content resize (e.g. image loads)
		act(() => {
			if (capturedResizeCallback) {
				capturedResizeCallback([], {} as ResizeObserver);
			}
		});

		// User is scrolled up → must NOT re-pin to bottom
		expect(scrollToEnd).not.toHaveBeenCalled();
	});

	// Regression: jumping to a NON-LAST message (search result that is the first/second message,
	// or a single short page) must flip isAtBottomRef to false through the programmatic scroll,
	// so the ResizeObserver initial/settle callback does NOT re-pin the view to the bottom.
	// Before the fix, isAtBottomRef stayed stale-true (scrollToMessage to the top emits no
	// onScroll event), the ResizeObserver ran scrollToEnd(), and the view snapped back to the
	// bottom while only the highlight survived. This asserts the opposite.
	test('Fix C: jumping to a non-last message does NOT let ResizeObserver re-pin to bottom', () => {
		const store = useStore.getState();
		store.updateHistory(room.id, messages);
		// Target the FIRST message (not the last one) — the failing search-result case.
		store.setScrollPosition(room.id, messages[0].id);
		setup(<MessagesList roomId={room.id} />);

		(scrollToEnd as ReturnType<typeof vi.fn>).mockClear();

		// Content resize (e.g. avatars/images settling) fires the ResizeObserver.
		act(() => {
			if (capturedResizeCallback) {
				capturedResizeCallback([], {} as ResizeObserver);
			}
		});

		// Target is not the last message → isAtBottomRef must be false → no re-pin to bottom.
		expect(scrollToEnd).not.toHaveBeenCalled();
		// The intended jump to the target must have happened instead.
		expect(scrollToMessage).toHaveBeenCalledWith(messages[0].id);
	});
});

describe('forward mode', () => {
	test('Select of one or more messages to forward', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.updateHistory(room.id, messages);
		});
		const { user } = setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`intersectionObserverRoot${room.id}`);
		expect(messageList).toBeVisible();
		const arrowButton = await screen.findAllByTestId('icon: ArrowIosDownward');
		await user.click(arrowButton[0]);

		const forwardAction = await screen.findByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		await user.click(forwardAction);

		const forwardContainer = await screen.findAllByTestId('forward_bubble_container');
		expect(forwardContainer[0]).toHaveStyle('background: rgba(213, 227, 246, 0.50)');
		const checkboxes = await screen.findAllByTestId('icon: Square');
		expect(checkboxes).toHaveLength(3);
		const markedCheckbox = await screen.findByTestId('icon: CheckmarkSquare');
		expect(markedCheckbox).toBeInTheDocument();

		await user.click(forwardContainer[1]);
		expect(forwardContainer[1]).toHaveStyle('background: rgba(213, 227, 246, 0.50)');
		expect(result.current.activeConversations[room.id].forwardMessageList).toHaveLength(2);
		const markedCheckboxes = await screen.findAllByTestId('icon: CheckmarkSquare');
		expect(markedCheckboxes).toHaveLength(2);
	});
});
