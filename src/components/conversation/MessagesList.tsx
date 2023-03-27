/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { debounce, find, forEach, groupBy, map } from 'lodash';
import moment from 'moment-timezone';
import React, {
	ForwardedRef,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import styled from 'styled-components';
import { v4 as uuidGenerator } from 'uuid';

import useEventListener, { EventName } from '../../hooks/useEventListener';
import { messageWhereScrollIsStoppedEqualityFn } from '../../store/equalityFunctions/ActiveConversationsEqualityFunctions';
import {
	getHistoryIsFullyLoaded,
	getHistoryIsLoadedDisabled,
	getIdMessageWhereScrollIsStopped,
	getInputHasFocus,
	getRoomIsWritingList
} from '../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../store/selectors/ConnectionSelector';
import { getMyLastMarkerOfConversation } from '../../store/selectors/MarkersSelectors';
import { getMessagesSelector } from '../../store/selectors/MessagesSelectors';
import { getPrefTimezoneSelector, getUserId } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { FileToUpload } from '../../types/store/ActiveConversationTypes';
import { Message, MessageType, TextMessage } from '../../types/store/MessageTypes';
import { isBefore, now } from '../../utils/dateUtil';
import DropZoneView from './DropZoneView';
import AnimationGlobalStyle from './messageBubbles/BubbleAnimationsGlobalStyle';
import MessageFactory from './messageBubbles/MessageFactory';
import WritingBubble from './messageBubbles/WritingBubble';
import MessageHistoryLoader from './MessageHistoryLoader';
import ScrollButton from './ScrollButton';
import useFirstUnreadMessage from './useFirstUnreadMessage';

const Messages = styled(Container)`
	position: relative;
	overflow: hidden;
`;

const MessagesListWrapper = styled(Container)`
	padding: 0.9375rem;
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
	const usersWritingList = useStore((store) => getRoomIsWritingList(store, roomId));
	const actualScrollPosition = useStore(
		(store) => getIdMessageWhereScrollIsStopped(store, roomId),
		messageWhereScrollIsStoppedEqualityFn
	);
	const hasMoreMessageToLoad = useStore((store) => getHistoryIsFullyLoaded(store, roomId));
	const historyLoadedDisabled = useStore((store) => getHistoryIsLoadedDisabled(store, roomId));
	const setIdMessageWhereScrollIsStopped = useStore(
		(store) => store.setIdMessageWhereScrollIsStopped
	);
	const setHistoryLoadDisabled = useStore((store) => store.setHistoryLoadDisabled);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const myUserId = useStore(getUserId);
	const myLastMarker = useStore((store) => getMyLastMarkerOfConversation(store, roomId));
	const timezone = useStore(getPrefTimezoneSelector);
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);

	const [showScrollButton, setShowScrollButton] = useState(false);
	const [isLoadedFirstTime, setIsLoadedFirstTime] = useState(true);
	const [dropzoneEnabled, setDropzoneEnabled] = useState(false);

	const messageScrollPositionObserver = useRef<IntersectionObserver>();
	const historyLoaderObserver = useRef<IntersectionObserver>();
	const messageListRef: ForwardedRef<any> = useRef();
	const MessagesListWrapperRef: ForwardedRef<any> = useRef();
	const listOfMessagesObservedRef = useRef<HTMLElement[]>([]);
	const messageHistoryLoaderRef = React.createRef<HTMLDivElement>();

	const firstNewMessage = useFirstUnreadMessage(roomId);

	const readMessage = useCallback(
		(refId) => {
			const message: Message | undefined = find(roomMessages, (message) => refId === message.id);
			let markMessageAsRead;
			if (myLastMarker && find(roomMessages, (msg) => msg.id === myLastMarker.messageId)) {
				const markedMsg = find(roomMessages, (msg) => msg.id === myLastMarker.messageId);
				markMessageAsRead =
					markedMsg &&
					message &&
					!(markedMsg.date === message.date) &&
					isBefore(markedMsg.date, message.date);
			} else if (
				find(roomMessages, (msg) => msg.id === myLastMarker?.messageId || !!myLastMarker)
			) {
				markMessageAsRead = true;
			}
			if (
				message &&
				message.type === MessageType.TEXT_MSG &&
				message.from !== myUserId &&
				markMessageAsRead &&
				inputHasFocus
			) {
				xmppClient.readMessage(message.roomId, message.id);
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

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const handleHistoryLoader = useCallback(
		debounce(() => {
			const date = roomMessages.length > 0 ? roomMessages[0].date : now();
			if (!historyLoadedDisabled) {
				xmppClient.requestHistory(roomId, date, 50);
				setHistoryLoadDisabled(roomId, true);
			}
		}, 500),
		[roomMessages.length, roomId, actualScrollPosition, historyLoadedDisabled]
	);

	const intersectionObserverCallback = useCallback(
		(entries) => {
			if (roomMessages.length > 1) {
				const lastMsg = document.getElementById(
					`message-${roomMessages[roomMessages.length - 1].id}`
				);
				const lastMsgRect = lastMsg ? lastMsg.getBoundingClientRect() : null;
				setShowScrollButton(
					lastMsgRect !== null && lastMsgRect.bottom >= document.documentElement.clientHeight
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

	const destroyObserver = useCallback(() => {
		if (messageScrollPositionObserver.current) {
			messageScrollPositionObserver.current && messageScrollPositionObserver.current.disconnect();
		}
	}, []);

	const observerInit = useCallback(() => {
		if (messageListRef.current) {
			messageScrollPositionObserver.current = new IntersectionObserver(
				intersectionObserverCallback,
				{
					root: messageListRef.current,
					rootMargin: `-${messageListRef.current.clientHeight - 100}px 0px 15px 0px`,
					threshold: [0.25, 0.75]
				}
			);
		}

		listOfMessagesObservedRef.current.forEach((messageRef: any) => {
			if (messageScrollPositionObserver.current && messageRef.current) {
				messageScrollPositionObserver.current.observe(messageRef.current);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [destroyObserver, intersectionObserverCallback]);

	const historyLoaderIntersectionObserverCallback = useCallback(
		([entry]) => {
			if (entry.intersectionRatio === 1) {
				handleHistoryLoader.cancel();
				handleHistoryLoader();
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			roomMessages.length,
			messageListRef,
			inputHasFocus,
			actualScrollPosition,
			historyLoadedDisabled
		]
	);

	const historyLoaderDestroyObserver = useCallback(() => {
		if (historyLoaderObserver.current) {
			historyLoaderObserver.current && historyLoaderObserver.current.disconnect();
		}
	}, []);

	const historyLoaderObserverInit = useCallback(() => {
		if (messageListRef.current) {
			historyLoaderObserver.current = new IntersectionObserver(
				historyLoaderIntersectionObserverCallback,
				{
					root: messageListRef.current,
					rootMargin: '0px',
					threshold: 1
				}
			);
		}

		if (historyLoaderObserver.current && messageHistoryLoaderRef.current) {
			historyLoaderObserver.current?.observe(messageHistoryLoaderRef.current);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [historyLoaderDestroyObserver, intersectionObserverCallback]);

	useEffect(() => {
		observerInit();
		return () => destroyObserver();
	}, [destroyObserver, observerInit]);

	useEffect(() => {
		historyLoaderObserverInit();
		return () => historyLoaderDestroyObserver();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [destroyObserver, observerInit, roomMessages.length]);

	useEffect(() => {
		// set history is loaded for the first time
		if (roomMessages.length <= 3 && isLoadedFirstTime) {
			setIsLoadedFirstTime(false);
		}

		// first part scroll to end when the chat is loaded for the first time
		if (!isLoadedFirstTime && !actualScrollPosition) {
			MessagesListWrapperRef.current.scrollTo({
				top: MessagesListWrapperRef.current.scrollHeight,
				behavior: 'instant'
			});
		} else if (historyLoadedDisabled) {
			// keep the scroll to the message where we stopped scroll because history loader appeared and is loading history
			const messageRef = window.document.getElementById(`message-${actualScrollPosition}`);
			messageRef?.scrollIntoView({ block: 'end' });
		}
	}, [roomMessages, isLoadedFirstTime, actualScrollPosition, historyLoadedDisabled]);

	useEffect(() => {
		if (!actualScrollPosition && roomMessages.length >= 1 && !isLoadedFirstTime && inputHasFocus) {
			const lastMessage = roomMessages[roomMessages.length - 1];
			if (
				lastMessage.type === MessageType.TEXT_MSG &&
				lastMessage.from !== myUserId &&
				(!myLastMarker || lastMessage.id !== myLastMarker?.messageId)
			) {
				xmppClient.readMessage(lastMessage.roomId, lastMessage.id);
			}
		}
	}, [
		isLoadedFirstTime,
		roomMessages,
		actualScrollPosition,
		inputHasFocus,
		myLastMarker,
		myUserId,
		xmppClient
	]);

	useEffect(() => {
		// scroll to the previous position after have changed the conversation
		if (actualScrollPosition) {
			const messageRef = window.document.getElementById(`message-${actualScrollPosition}`);
			messageRef?.scrollIntoView({ block: 'end' });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId]);

	useEffect(() => {
		// Scroll all the way down when the is writing label appears to make it always visible
		if (
			usersWritingList &&
			usersWritingList.length > 0 &&
			roomMessages.length > 0 &&
			actualScrollPosition === roomMessages[roomMessages.length - 1].id
		) {
			MessagesListWrapperRef.current.scrollTo({
				top: MessagesListWrapperRef.current.scrollHeight,
				behavior: 'instant'
			});
		}
	}, [usersWritingList, actualScrollPosition, roomMessages]);

	const dateMessageWrapped = useMemo(
		() => groupBy(roomMessages, (message) => moment.tz(message.date, timezone).format('YYMMDD')),
		[roomMessages, timezone]
	);

	const messagesWrapped = useMemo(() => {
		const list: JSX.Element[] = [];
		map(dateMessageWrapped, (wrapper) => {
			const messageList = map(wrapper, (message: Message, index) => {
				const messageRef = React.createRef<HTMLElement>();
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				listOfMessagesObservedRef.current.push(messageRef);
				let prevMessageIsFromSameSender;
				let nextMessageIsFromSameSender;

				const prevMessage = wrapper[index - 1];
				if (message.type === MessageType.TEXT_MSG && prevMessage?.type === MessageType.TEXT_MSG) {
					prevMessageIsFromSameSender = (prevMessage as TextMessage).from === message.from;
				} else {
					prevMessageIsFromSameSender = false;
				}

				const nextMessage = wrapper[index + 1];
				if (message.type === MessageType.TEXT_MSG && nextMessage?.type === MessageType.TEXT_MSG) {
					nextMessageIsFromSameSender = nextMessage.from === message.from;
				} else {
					nextMessageIsFromSameSender = false;
				}

				return (
					<MessageFactory
						key={`factory-${message.id}`}
						messageId={message.id}
						messageRoomId={message.roomId}
						prevMessageIsFromSameSender={prevMessageIsFromSameSender}
						nextMessageIsFromSameSender={nextMessageIsFromSameSender}
						messageRef={messageRef}
						isFirstNewMessage={firstNewMessage === message.id}
					/>
				);
			});
			list.push(
				<Container
					key={`messageList-${Math.random()}`}
					data-testid={`messageListRef${roomId}`}
					mainAlignment={'flex-start'}
					crossAlignment={'flex-start'}
					height={'fit'}
				>
					{messageList}
				</Container>
			);
		});
		return list;
	}, [dateMessageWrapped, firstNewMessage, roomId]);

	const handleClickScrollButton = useCallback(() => {
		MessagesListWrapperRef?.current &&
			MessagesListWrapperRef.current.scrollTo({
				top: MessagesListWrapperRef.current.scrollHeight,
				behavior: 'instant'
			});
		setInputHasFocus(roomId, true);
	}, [MessagesListWrapperRef, roomId, setInputHasFocus]);

	const newMessageScrollToButtonHandler = useCallback(
		// scroll to the bottom when a new message arrives, and we are already at the bottom
		// checking to be actually at the bottom and also if last message it's mine
		// since we want to go always at the bottom when we send a message, no matter
		// if we scrolled up in the history
		(messageFromEvent) => {
			if (
				actualScrollPosition === roomMessages[roomMessages.length - 1].id ||
				(messageFromEvent.detail.type === MessageType.TEXT_MSG &&
					messageFromEvent.detail.from === myUserId)
			) {
				setTimeout(() => {
					MessagesListWrapperRef.current.scrollTo({
						top: MessagesListWrapperRef.current.scrollHeight,
						behavior: 'instant'
					});
				}, 200);
			}
		},
		[actualScrollPosition, roomMessages, myUserId]
	);

	const handleOnDrop = useCallback(
		(ev) => {
			ev.preventDefault();
			const listOfFiles: FileToUpload[] = [];
			forEach(ev.dataTransfer.files, (file: File) => {
				const fileLocalUrl = URL.createObjectURL(file);
				const fileId = uuidGenerator();
				listOfFiles.push({
					file,
					fileId,
					hasFocus: false,
					description: '',
					localUrl: fileLocalUrl
				});
			});
			setFilesToAttach(roomId, listOfFiles);
			setDropzoneEnabled(false);
		},
		[roomId, setFilesToAttach]
	);

	const handleOnDragOver = useCallback((ev) => {
		ev.preventDefault();
		setDropzoneEnabled(true);
	}, []);

	const handleOnDragLeave = useCallback((ev) => {
		ev.preventDefault();
		setDropzoneEnabled(false);
	}, []);

	useEventListener(EventName.NEW_MESSAGE, newMessageScrollToButtonHandler);

	return (
		<Messages
			ref={messageListRef}
			id={`intersectionObserverRoot${roomId}`}
			data-testid={`intersectionObserverRoot${roomId}`}
			mainAlignment={'flex-start'}
			crossAlignment={'flex-start'}
			onDragOver={handleOnDragOver}
		>
			{dropzoneEnabled && (
				<DropZoneView
					onDragOverEvent={handleOnDragOver}
					onDropEvent={handleOnDrop}
					onDragLeaveEvent={handleOnDragLeave}
				/>
			)}
			<AnimationGlobalStyle />
			<MessagesListWrapper
				ref={MessagesListWrapperRef}
				id={`messageListRef${roomId}`}
				mainAlignment={'flex-start'}
				crossAlignment={'flex-start'}
			>
				{!hasMoreMessageToLoad && (
					<MessageHistoryLoader messageHistoryLoaderRef={messageHistoryLoaderRef} />
				)}
				{messagesWrapped}
				{usersWritingList && <WritingBubble writingListNames={usersWritingList} />}
			</MessagesListWrapper>
			{showScrollButton && <ScrollButton roomId={roomId} onClickCb={handleClickScrollButton} />}
		</Messages>
	);
};

export default MessagesList;
