/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';
import { debounce, groupBy, last, map, size } from 'lodash';

import AnimationGlobalStyle from './messageBubbles/BubbleAnimationsGlobalStyle';
import MessageFactory from './messageBubbles/MessageFactory';
import MessageHistoryLoader, { HistoryLoaderAfter } from './MessageHistoryLoader';
import ScrollButton from './ScrollButton';
import useFirstUnreadMessage from './useFirstUnreadMessage';
import useEventListener, { EventName, NewMessageEvent } from '../../../hooks/useEventListener';
import ChatApi from '../../../network/apis/ChatApi';
import {
	getHistoryIsFullyLoaded,
	getIdMessageWhereScrollIsStopped,
	getInputHasFocus
} from '../../../store/selectors/ActiveConversationsSelectors';
import {
	enhanceWithDateMessages,
	getMessagesSelector,
	getMyLastMarkerOfRoom
} from '../../../store/selectors/ChatsRegistrySelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { Message, MessageType } from '../../../types/store/ChatsRegistryTypes';
import { formatDate } from '../../../utils/dateUtils';
import { scrollToEnd, scrollToMessage } from '../../../utils/scrollUtils';

const Messages = styled(Container)`
	position: relative;
	overflow: hidden;
`;

const MessagesListWrapper = styled(Container)`
	padding-top: 0.9375rem;
	padding-bottom: 0.9375rem;
	padding-left: 0.4375rem;
	overflow-y: scroll;
	overflow-x: hidden;
	align-self: auto;
`;

type ConversationProps = {
	roomId: string;
};

const MessagesList = ({ roomId }: ConversationProps): ReactElement => {
	const inputHasFocus = useStore((store) => getInputHasFocus(store, roomId));
	const messages = useStore((store) => getMessagesSelector(store, roomId));
	const roomMessages = useMemo(() => enhanceWithDateMessages(messages), [messages]);
	const actualScrollPosition = useStore((store) => getIdMessageWhereScrollIsStopped(store, roomId));
	const hasMoreMessageToLoad = useStore((store) => getHistoryIsFullyLoaded(store, roomId));
	const setScrollPosition = useStore((store) => store.setScrollPosition);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const myUserId = useStore(getUserId);
	const myLastMarker = useStore((store) => getMyLastMarkerOfRoom(store, roomId));

	const [showScrollButton, setShowScrollButton] = useState(false);

	const messageScrollPositionObserver = useRef<IntersectionObserver>();
	const messageListRef = useRef<HTMLDivElement>(null);
	const MessagesListWrapperRef = useRef<HTMLDivElement>(null);
	const listOfMessagesObservedRef = useRef<React.RefObject<HTMLDivElement>[]>([]);

	const firstNewMessage = useFirstUnreadMessage(roomId);
	const unreadCount = useStore((store) => store.chatsRegistry[roomId]?.unread ?? 0);
	const decrementUnreadCount = useStore((store) => store.decrementUnreadCount);

	// Track the previous last message to detect new messages from me
	const prevLastMessageIdRef = useRef<string | undefined>(undefined);

	// Track if a read request is in flight to prevent duplicate calls
	const isMarkingAsReadRef = useRef(false);

	// Mark all messages in the room as read (single API call)
	const markRoomAsRead = useCallback(() => {
		const registry = useStore.getState().chatsRegistry[roomId];
		// Check if there are unread messages and we're not already marking
		const currentUnread = registry?.unread ?? 0;
		if (currentUnread === 0 || isMarkingAsReadRef.current) return;

		// Don't mark as read if we're viewing historical pages (hasMoreAfter=true)
		// User hasn't actually seen the latest messages yet
		const hasMoreAfter = registry?.hasMoreAfter ?? false;
		if (hasMoreAfter) return;

		// Snapshot the last visible message to mark up to this point
		const msgs = registry?.messages ?? [];
		const lastMsg = msgs[msgs.length - 1];
		if (!lastMsg) return;
		const targetMessageId = (lastMsg as any).stanzaId ?? (lastMsg as any).id;
		if (!targetMessageId) return;
		const unreadAtStart = currentUnread;

		isMarkingAsReadRef.current = true;
		ChatApi.setReadMarker(roomId, targetMessageId)
			.then(() => {
				// Only decrement what we covered — messages arriving during
				// the round-trip retain their unread count for next pass
				decrementUnreadCount(roomId, unreadAtStart);
			})
			.catch((err: unknown) => {
				console.error('[MessagesList] Failed to mark room as read:', err);
			})
			.finally(() => {
				isMarkingAsReadRef.current = false;
			});
	}, [roomId, decrementUnreadCount]);

	// Called when scroll position changes - mark as read if at bottom
	const onScrollPositionChange = useCallback(
		(messageId: string) => {
			// Check if this is the last message (user is at bottom)
			const msgs = useStore.getState().chatsRegistry[roomId]?.messages;
			const lastMsgId = msgs?.[msgs.length - 1]?.id;
			if (messageId === lastMsgId) {
				markRoomAsRead();
			}
		},
		[roomId, markRoomAsRead]
	);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSetterScrollPosition = useCallback(
		debounce((refId) => {
			const oldScrollPosition =
				useStore.getState().activeConversations[roomId]?.scrollPositionMessageId;
			if (oldScrollPosition !== refId) {
				setScrollPosition(roomId, refId);
			}
			onScrollPositionChange(refId);
		}, 150),
		[setScrollPosition, onScrollPositionChange, roomId]
	);

	const intersectionObserverCallback = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			if (size(roomMessages) > 1) {
				const lastMsg = document.getElementById(`message-${last(roomMessages)?.id}`);
				const lastMsgRect = lastMsg?.getBoundingClientRect();
				setShowScrollButton(
					lastMsgRect != null && lastMsgRect?.bottom >= document.documentElement.clientHeight
				);
				entries.forEach((entry: IntersectionObserverEntry) => {
					if (entry.isIntersecting) {
						debouncedSetterScrollPosition.cancel();
						debouncedSetterScrollPosition(entry.target.id.split('message-')[1]);
					}
				});
			}
		},
		[roomMessages, debouncedSetterScrollPosition]
	);

	const observerInit = useCallback(() => {
		if (messageListRef.current && messageListRef.current.clientHeight > 100) {
			messageScrollPositionObserver.current = new IntersectionObserver(
				intersectionObserverCallback,
				{
					root: messageListRef.current,
					rootMargin: `-${messageListRef.current.clientHeight - 100}px 0px 15px 0px`,
					threshold: [0, 0.25, 0.5, 0.75, 1]
				}
			);
		}

		listOfMessagesObservedRef.current.forEach((messageRef: React.RefObject<HTMLDivElement>) => {
			if (messageScrollPositionObserver.current && messageRef.current) {
				messageScrollPositionObserver.current.observe(messageRef.current);
			}
		});
	}, [intersectionObserverCallback]);

	useEffect(() => {
		observerInit();
		return (): void => messageScrollPositionObserver.current?.disconnect();
	}, [observerInit]);

	// Mark as read when user is at bottom and there are unread messages
	// This handles: initial load at bottom, scrolling to bottom, new messages when at bottom
	useEffect(() => {
		if (unreadCount > 0 && size(roomMessages) > 0) {
			// Check if user is at the bottom (viewing the last message)
			const currentScrollPos =
				useStore.getState().activeConversations[roomId]?.scrollPositionMessageId;
			const lastMsgId = roomMessages[roomMessages.length - 1]?.id;

			// If no scroll position set (initial load) or at last message, mark as read
			if (!currentScrollPos || currentScrollPos === lastMsgId) {
				markRoomAsRead();
			}
		}
	}, [unreadCount, roomMessages, roomId, markRoomAsRead]);

	// Manage initial scroll position
	useEffect(() => {
		const store = useStore.getState();
		const actualPosition = store.activeConversations[roomId]?.scrollPositionMessageId;
		const lastMsg = last(store.chatsRegistry[roomId]?.messages)?.id;
		if (
			store.chatsRegistry[roomId]?.unread > 0 ||
			!actualPosition ||
			(lastMsg === actualPosition && store.chatsRegistry[roomId].unread === 0)
		) {
			scrollToEnd(MessagesListWrapperRef);
		} else {
			scrollToMessage(actualPosition);
		}
	}, [roomId]);

	const messagesSize = useMemo(() => size(roomMessages), [roomMessages]);

	// Manage scroll position when messages size changes
	useEffect(() => {
		const actualPosition = useStore.getState().activeConversations[roomId]?.scrollPositionMessageId;

		if (!actualPosition) {
			scrollToEnd(MessagesListWrapperRef);
		} else {
			scrollToMessage(actualPosition);
		}
	}, [messagesSize, roomId]);

	const dateMessageWrapped = useMemo(
		() => groupBy(roomMessages, (message) => formatDate(message.date, 'YYMMDD')),
		[roomMessages]
	);

	const messagesWrapped = useMemo(() => {
		listOfMessagesObservedRef.current = [];
		return map(dateMessageWrapped, (wrapper, idx) => {
			const messageList = map(wrapper, (message: Message, index) => {
				const messageRef = React.createRef<HTMLDivElement>();
				listOfMessagesObservedRef.current.push(messageRef);

				const prevMessage = wrapper[index - 1];
				const prevMessageIsFromSameSender =
					message.type === MessageType.TEXT_MSG &&
					prevMessage?.type === MessageType.TEXT_MSG &&
					prevMessage.from === message.from;
				const isPrevMessageDeleted = !!(
					prevMessage?.type === MessageType.TEXT_MSG && prevMessage?.deletedInfo
				);

				const nextMessage = wrapper[index + 1];
				const nextMessageIsFromSameSender =
					message.type === MessageType.TEXT_MSG &&
					nextMessage?.type === MessageType.TEXT_MSG &&
					nextMessage.from === message.from;

				return (
					<MessageFactory
						key={`factory-${message.id}`}
						message={message}
						prevMessageIsFromSameSender={prevMessageIsFromSameSender}
						nextMessageIsFromSameSender={nextMessageIsFromSameSender}
						messageRef={messageRef}
						messageListRef={messageListRef}
						isFirstNewMessage={firstNewMessage === message.id}
						isPrevMessageDeleted={isPrevMessageDeleted}
					/>
				);
			});
			return (
				<Container
					key={`messageList-${roomId}-${idx}`}
					data-testid={`messageListRef${roomId}`}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height={'fit'}
				>
					{messageList}
				</Container>
			);
		});
	}, [dateMessageWrapped, firstNewMessage, roomId]);

	const handleClickScrollButton = useCallback(() => {
		scrollToEnd(MessagesListWrapperRef);
		setInputHasFocus(roomId, true);
	}, [MessagesListWrapperRef, roomId, setInputHasFocus]);

	// Scroll to bottom when I send a message (detect new message from me)
	// Use the raw messages array (not enhanced with date messages) to detect new messages
	useEffect(() => {
		const store = useStore.getState();

		// Don't auto-scroll when loading timeline (e.g., search result navigation or pagination)
		if (store.chatsRegistry[roomId]?.isLoadingTimeline) return;

		const lastMessage = last(messages);
		const lastMessageId = lastMessage?.id;
		const prevLastMessageId = prevLastMessageIdRef.current;

		// Update ref for next comparison
		prevLastMessageIdRef.current = lastMessageId;

		// If there's a new message and it's from me, scroll to bottom
		if (
			lastMessageId &&
			lastMessageId !== prevLastMessageId &&
			lastMessage?.type === MessageType.TEXT_MSG &&
			lastMessage?.from === myUserId
		) {
			// Use requestAnimationFrame to ensure DOM is updated, then scroll
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					handleClickScrollButton();
				});
			});
		}
	}, [messages, myUserId, handleClickScrollButton, roomId]);

	// Scroll to bottom when at bottom and new message arrives from others
	const newMessageScrollToButtonHandler = useCallback(
		(event: CustomEvent<NewMessageEvent['data']> | undefined) => {
			if (size(roomMessages) > 0 && event?.detail.roomId === roomId) {
				const isMyMessage = event?.detail.from === myUserId;
				const isAtBottom = actualScrollPosition === last(roomMessages)?.id;

				// Only scroll for others' messages when at bottom (my messages handled by useEffect above)
				if (!isMyMessage && isAtBottom) {
					setTimeout(() => {
						scrollToEnd(MessagesListWrapperRef);
					}, 200);
				}
			}
		},
		[roomId, actualScrollPosition, roomMessages, myUserId]
	);

	useEventListener(EventName.NEW_MESSAGE, newMessageScrollToButtonHandler);

	return (
		<Messages
			key={`messagesBox-${roomId}`}
			ref={messageListRef}
			id={`intersectionObserverRoot${roomId}`}
			data-testid={`intersectionObserverRoot${roomId}`}
			mainAlignment="flex-start"
			crossAlignment="flex-start"
		>
			<AnimationGlobalStyle />
			<MessagesListWrapper
				ref={MessagesListWrapperRef}
				id={`messageListRef${roomId}`}
				mainAlignment="flex-start"
				crossAlignment="flex-start"
			>
				{!hasMoreMessageToLoad && (
					<MessageHistoryLoader
						roomId={roomId}
						messageListRef={messageListRef}
					/>
				)}
					{messagesWrapped}
				<HistoryLoaderAfter
					roomId={roomId}
					messageListRef={messageListRef}
				/>
			</MessagesListWrapper>
			{showScrollButton && <ScrollButton roomId={roomId} onClickCb={handleClickScrollButton} />}
		</Messages>
	);
};

export default MessagesList;
