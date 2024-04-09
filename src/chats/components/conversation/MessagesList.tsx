/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { debounce, find, groupBy, last, map, size } from 'lodash';
import styled from 'styled-components';

import AnimationGlobalStyle from './messageBubbles/BubbleAnimationsGlobalStyle';
import MessageFactory from './messageBubbles/MessageFactory';
import MessageHistoryLoader from './MessageHistoryLoader';
import ScrollButton from './ScrollButton';
import useFirstUnreadMessage from './useFirstUnreadMessage';
import useEventListener, { EventName } from '../../../hooks/useEventListener';
import {
	getHistoryIsFullyLoaded,
	getHistoryIsLoadedDisabled,
	getIdMessageWhereScrollIsStopped,
	getInputHasFocus
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import { getMyLastMarkerOfRoom } from '../../../store/selectors/MarkersSelectors';
import { getMessagesSelector } from '../../../store/selectors/MessagesSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { Message, MessageType } from '../../../types/store/MessageTypes';
import { formatDate, isBefore } from '../../../utils/dateUtils';
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
	align-self: auto;
`;

type ConversationProps = {
	roomId: string;
};

const MessagesList = ({ roomId }: ConversationProps): ReactElement => {
	const xmppClient = useStore(getXmppClient);
	const inputHasFocus = useStore((store) => getInputHasFocus(store, roomId));
	const roomMessages = useStore((store) => getMessagesSelector(store, roomId));
	const actualScrollPosition = useStore((store) => getIdMessageWhereScrollIsStopped(store, roomId));
	const hasMoreMessageToLoad = useStore((store) => getHistoryIsFullyLoaded(store, roomId));
	const historyLoadedDisabled = useStore((store) => getHistoryIsLoadedDisabled(store, roomId));
	const setIdMessageWhereScrollIsStopped = useStore(
		(store) => store.setIdMessageWhereScrollIsStopped
	);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const myUserId = useStore(getUserId);
	const myLastMarker = useStore((store) => getMyLastMarkerOfRoom(store, roomId));

	const [showScrollButton, setShowScrollButton] = useState(false);

	const messageScrollPositionObserver = useRef<IntersectionObserver>();
	const messageListRef = useRef<HTMLDivElement>(null);
	const MessagesListWrapperRef = useRef<HTMLDivElement>(null);
	const listOfMessagesObservedRef = useRef<React.RefObject<HTMLDivElement>[]>([]);

	const firstNewMessage = useFirstUnreadMessage(roomId);

	const readMessage = useCallback(
		(refId: string) => {
			const selectedMessage = find(roomMessages, (message) => refId === message.id);
			const isReadable =
				(selectedMessage?.type === MessageType.TEXT_MSG && selectedMessage.from !== myUserId) ||
				selectedMessage?.type === MessageType.CONFIGURATION_MSG;
			if (inputHasFocus && isReadable) {
				// Mark as read when:
				// - there isn't a marker because it's means I never saw a message of that conversation
				// - marked message isn't in the list of messages in the store (marker is older than the oldest message)
				// - marked message is older than the message that is on the screen
				const markedMsg = find(roomMessages, (msg) => msg.id === myLastMarker?.messageId);
				const canMessageBeMarkedAsRead =
					!!markedMsg &&
					markedMsg.date !== selectedMessage.date &&
					isBefore(markedMsg.date, selectedMessage.date);
				if (!myLastMarker || !markedMsg || canMessageBeMarkedAsRead) {
					xmppClient.readMessage(selectedMessage.roomId, selectedMessage.id);
				}
			}
		},
		[roomMessages, myLastMarker, inputHasFocus, myUserId, xmppClient]
	);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSetterScrollPosition = useCallback(
		debounce((refId) => {
			setIdMessageWhereScrollIsStopped(roomId, refId);
			readMessage(refId);
		}, 150),
		[setIdMessageWhereScrollIsStopped, readMessage, roomId]
	);

	const intersectionObserverCallback = useCallback(
		(entries) => {
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
		return () => messageScrollPositionObserver.current?.disconnect();
	}, [observerInit]);

	// Read last message when user enters for the first time in a conversation
	useEffect(() => {
		if (!actualScrollPosition && size(roomMessages) > 0 && inputHasFocus) {
			const lastMessage = last(roomMessages);
			if (lastMessage) {
				readMessage(lastMessage.id);
			}
		}
	}, [roomMessages, actualScrollPosition, readMessage, inputHasFocus]);

	// Manage initial scroll position
	useEffect(() => {
		const store = useStore.getState();
		const actualPosition = store.activeConversations[roomId]?.scrollPositionMessageId;
		const lastMsg = last(store.messages[roomId])?.id;
		if (
			store.unreads[roomId] > 0 ||
			!actualPosition ||
			(lastMsg === actualPosition && store.unreads[roomId] === 0)
		) {
			scrollToEnd(MessagesListWrapperRef);
		} else {
			scrollToMessage(actualPosition);
		}
	}, [roomId]);

	// Scroll all the way down when the is writing label appears to make it always visible

	// Keep the scroll position when messages number changes
	useEffect(() => {
		// When the chat is loaded for the first time keep scroll to the bottom
		if (!actualScrollPosition) {
			scrollToEnd(MessagesListWrapperRef);
		} else if (historyLoadedDisabled) {
			// Keep the scroll to the message where we stopped scroll because history loader appeared and is loading history
			scrollToMessage(actualScrollPosition);
		}
	}, [roomMessages, actualScrollPosition, historyLoadedDisabled]);

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

				const nextMessage = wrapper[index + 1];
				const nextMessageIsFromSameSender =
					message.type === MessageType.TEXT_MSG &&
					nextMessage?.type === MessageType.TEXT_MSG &&
					nextMessage.from === message.from;

				return (
					<MessageFactory
						key={`factory-${message.id}`}
						messageId={message.id}
						messageRoomId={message.roomId}
						prevMessageIsFromSameSender={prevMessageIsFromSameSender}
						nextMessageIsFromSameSender={nextMessageIsFromSameSender}
						messageRef={messageRef}
						messageListRef={messageListRef}
						isFirstNewMessage={firstNewMessage === message.id}
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

	const newMessageScrollToButtonHandler = useCallback(
		// scroll to the bottom when a new message arrives, and we are already at the bottom
		// checking to be actually at the bottom and also if last message it's mine
		// since we want to go always at the bottom when we send a message, no matter
		// if we scrolled up in the history
		(messageFromEvent) => {
			if (
				size(roomMessages) > 0 &&
				messageFromEvent.detail.roomId === roomId &&
				(actualScrollPosition === last(roomMessages)?.id ||
					(messageFromEvent.detail.type === MessageType.TEXT_MSG &&
						messageFromEvent.detail.from === myUserId))
			) {
				setTimeout(() => {
					scrollToEnd(MessagesListWrapperRef);
				}, 200);
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
					<MessageHistoryLoader roomId={roomId} messageListRef={messageListRef} />
				)}
				{messagesWrapped}
			</MessagesListWrapper>
			{showScrollButton && <ScrollButton roomId={roomId} onClickCb={handleClickScrollButton} />}
		</Messages>
	);
};

export default MessagesList;
