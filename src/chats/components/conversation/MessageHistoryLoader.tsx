/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useRef } from 'react';

import styled from '@emotion/styled';
import { Icon } from '@zextras/carbonio-design-system';
import { first, last } from 'lodash';

import ChatApi from '../../../network/apis/ChatApi';
import {
	mapReadMarkersToMarkers,
	mapReactionsToFastenings,
	mapTimelineItemsToMessages
} from '../../../network/utils/messageMapper';
import { MessageFastening } from '../../../types/store/ChatsRegistryTypes';
import {
	getHistoryIsLoadedDisabled,
	getIsInitialTimelineLoaded
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

type HistoryLoaderProps = {
	roomId: string;
	messageListRef: React.RefObject<HTMLDivElement>;
};

const Loader = styled.div`
	background-color: ${({ theme }): string => theme.palette.gray6.active};
	color: #999;
	text-align: center;
	border-radius: 50%;
	margin: 0.875rem auto;
	width: 1.75rem;
	height: 1.75rem;

	@keyframes spin {
		0% {
			transform: scaleX(-1) rotate(0deg);
		}
		100% {
			transform: scaleX(-1) rotate(360deg);
		}
	}

	& svg {
		position: relative;
		top: 0.375rem;
		left: 0.375rem;
		animation: spin 1s linear infinite;
	}
`;

const VisibilityContainer = styled.div`
	width: 100%;
	text-align: center;
`;

function processTimelineResponse(
	response: { items: any[]; markers?: any[]; hasMoreBefore: boolean; hasMoreAfter: boolean },
	roomId: string,
	currentUserId: string
): void {
	const store = useStore.getState();
	const markers =
		response.markers && response.markers.length > 0
			? mapReadMarkersToMarkers(response.markers)
			: undefined;

	if (response.items.length > 0) {
		const messages = mapTimelineItemsToMessages(response.items, roomId, currentUserId);
		store.updateHistory(roomId, messages, markers);

		const allFastenings: MessageFastening[] = [];
		response.items.forEach((item) => {
			if (item.itemType === 'message' && item.message.reactions) {
				const fastenings = mapReactionsToFastenings(
					item.message.id,
					roomId,
					item.message.reactions
				);
				allFastenings.push(...fastenings);
			}
		});
		if (allFastenings.length > 0) {
			store.addFastening(allFastenings);
		}
	} else if (markers) {
		store.updateHistory(roomId, [], markers);
	}
}

/**
 * Loader for OLDER messages (appears at the top of the message list).
 * Uses historyLoadDisabled as the single guard against concurrent loads.
 * Re-enabling happens via scrollToMessage in MessagesList's useEffect —
 * after React renders new messages and scroll anchors to the right position,
 * the loader is out of viewport and won't re-trigger.
 */
export const HistoryLoaderBefore = ({
	roomId,
	messageListRef
}: HistoryLoaderProps): ReactElement => {
	const intersectionObserverRef = useRef<IntersectionObserver>();
	const loaderRef = React.createRef<HTMLDivElement>();

	const historyLoadDisabled = useStore(
		(store) => store.activeConversations[roomId]?.isHistoryLoadDisabled ?? false
	);
	const setHistoryLoadDisabled = useStore((store) => store.setHistoryLoadDisabled);
	const setHasMoreBefore = useStore((store) => store.setHasMoreBefore);
	const setHistoryIsFullyLoaded = useStore((store) => store.setHistoryIsFullyLoaded);
	const hasMoreBefore = useStore((store) => store.chatsRegistry[roomId]?.hasMoreBefore ?? true);
	const currentUserId = useStore(getUserId);

	const handleLoadBefore = useCallback(() => {
		if (historyLoadDisabled) return;
		if (!hasMoreBefore) return;

		const store = useStore.getState();
		const roomMessages = store.chatsRegistry[roomId]?.messages;
		if (!roomMessages || roomMessages.length === 0) return;
		if (roomId.startsWith('placeholder-')) return;

		const oldestMessage = first(roomMessages);
		const beforeDate = oldestMessage ? new Date(oldestMessage.date).toISOString() : undefined;
		// BUG-12: pass composite cursor to avoid skipping messages with identical timestamps
		const beforeMessageId = oldestMessage?.id;

		setHistoryLoadDisabled(roomId, true);

		ChatApi.getTimeline(roomId, { before: beforeDate, beforeId: beforeMessageId, limit: 50 })
			.then((response) => {
				processTimelineResponse(response, roomId, currentUserId || '');
				setHasMoreBefore(roomId, response.hasMoreBefore);
				if (response.hasMoreBefore) {
					setHistoryLoadDisabled(roomId, false);
				} else {
					setHistoryIsFullyLoaded(roomId);
				}
			})
			.catch((err) => {
				console.error('[HistoryLoaderBefore] Failed to load:', err);
				setHistoryLoadDisabled(roomId, false);
			});
	}, [roomId, historyLoadDisabled, hasMoreBefore, currentUserId, setHistoryLoadDisabled, setHasMoreBefore, setHistoryIsFullyLoaded]);

	useEffect(() => {
		if (messageListRef?.current && loaderRef?.current) {
			intersectionObserverRef.current = new IntersectionObserver(
				([entry]) => {
					if (entry.intersectionRatio === 1) {
						handleLoadBefore();
					}
				},
				{ root: messageListRef.current, rootMargin: '0px', threshold: 1 }
			);
			intersectionObserverRef.current.observe(loaderRef.current);
		}
		return (): void => intersectionObserverRef.current?.disconnect();
	}, [handleLoadBefore, loaderRef, messageListRef]);

	return (
		<VisibilityContainer data-testid="historyLoaderBefore" ref={loaderRef}>
			<Loader>
				<Icon icon="RefreshOutline" size="medium" />
			</Loader>
		</VisibilityContainer>
	);
};

/**
 * Loader for NEWER messages (appears at the bottom of the message list).
 */
export const HistoryLoaderAfter = ({
	roomId,
	messageListRef
}: HistoryLoaderProps): ReactElement | null => {
	const intersectionObserverRef = useRef<IntersectionObserver>();
	const loaderRef = React.createRef<HTMLDivElement>();

	const hasMoreAfter = useStore((store) => store.chatsRegistry[roomId]?.hasMoreAfter ?? false);
	const historyLoadDisabled = useStore(
		(store) => store.activeConversations[roomId]?.isHistoryLoadDisabled ?? false
	);
	const setHistoryLoadDisabled = useStore((store) => store.setHistoryLoadDisabled);
	const setHasMoreAfter = useStore((store) => store.setHasMoreAfter);
	const currentUserId = useStore(getUserId);

	const handleLoadAfter = useCallback(() => {
		if (historyLoadDisabled) return;
		if (!hasMoreAfter) return;

		const store = useStore.getState();
		const roomMessages = store.chatsRegistry[roomId]?.messages;
		if (!roomMessages || roomMessages.length === 0) return;
		if (roomId.startsWith('placeholder-')) return;

		const newestMessage = last(roomMessages);
		const afterDate = newestMessage ? new Date(newestMessage.date).toISOString() : undefined;

		setHistoryLoadDisabled(roomId, true);

		ChatApi.getTimeline(roomId, { after: afterDate, limit: 50 })
			.then((response) => {
				processTimelineResponse(response, roomId, currentUserId || '');
				setHasMoreAfter(roomId, response.hasMoreAfter);
				if (response.hasMoreAfter) {
					setHistoryLoadDisabled(roomId, false);
				}
			})
			.catch((err) => {
				console.error('[HistoryLoaderAfter] Failed to load:', err);
				setHistoryLoadDisabled(roomId, false);
			});
	}, [roomId, historyLoadDisabled, hasMoreAfter, currentUserId, setHistoryLoadDisabled, setHasMoreAfter]);

	useEffect(() => {
		if (messageListRef?.current && loaderRef?.current) {
			intersectionObserverRef.current = new IntersectionObserver(
				([entry]) => {
					if (entry.intersectionRatio === 1) {
						handleLoadAfter();
					}
				},
				{ root: messageListRef.current, rootMargin: '0px', threshold: 1 }
			);
			intersectionObserverRef.current.observe(loaderRef.current);
		}
		return (): void => intersectionObserverRef.current?.disconnect();
	}, [handleLoadAfter, loaderRef, messageListRef]);

	if (!hasMoreAfter) return null;

	return (
		<VisibilityContainer data-testid="historyLoaderAfter" ref={loaderRef}>
			<Loader>
				<Icon icon="RefreshOutline" size="medium" />
			</Loader>
		</VisibilityContainer>
	);
};

/**
 * Initial timeline loader - loads the first page when opening a conversation.
 * This handles the initial load, after which HistoryLoaderBefore/After take over.
 */
const MessageHistoryLoader = ({
	roomId,
	messageListRef
}: HistoryLoaderProps): ReactElement => {
	const intersectionObserverRef = useRef<IntersectionObserver>();
	const messageHistoryLoaderRef = React.createRef<HTMLDivElement>();

	const historyLoadedDisabled = useStore((store) => getHistoryIsLoadedDisabled(store, roomId));
	const isInitialTimelineLoaded = useStore((store) => getIsInitialTimelineLoaded(store, roomId));
	const setHistoryLoadDisabled = useStore((store) => store.setHistoryLoadDisabled);
	const setInitialTimelineLoaded = useStore((store) => store.setInitialTimelineLoaded);
	const setHasMoreBefore = useStore((store) => store.setHasMoreBefore);
	const setHistoryIsFullyLoaded = useStore((store) => store.setHistoryIsFullyLoaded);
	const currentUserId = useStore(getUserId);

	const handleHistoryLoader = useCallback(() => {
		const store = useStore.getState();
		const roomMessages = store.chatsRegistry[roomId]?.messages;
		const initialLoaded = store.activeConversations[roomId]?.isInitialTimelineLoaded;
		if (roomId.startsWith('placeholder-')) return;

		let beforeDate: string | undefined;
		let beforeMessageId: string | undefined;
		if (roomMessages && roomMessages.length > 0) {
			const oldestMessage = first(roomMessages);
			if (oldestMessage?.date) {
				beforeDate = new Date(oldestMessage.date).toISOString();
				// BUG-12: pass composite cursor anchor to avoid skipping messages with identical timestamps
				beforeMessageId = oldestMessage.id;
			}
		}

		if (!historyLoadedDisabled) {
			setHistoryLoadDisabled(roomId, true);
			ChatApi.getTimeline(roomId, { before: beforeDate, beforeId: beforeMessageId, limit: 50 })
				.then((response) => {
					processTimelineResponse(response, roomId, currentUserId || '');

					if (!initialLoaded) {
						setInitialTimelineLoaded(roomId);
					}

					setHasMoreBefore(roomId, response.hasMoreBefore);

					if (response.hasMoreBefore) {
						setHistoryLoadDisabled(roomId, false);
					} else {
						setHistoryIsFullyLoaded(roomId);
					}
				})
				.catch((err) => {
					console.error('[MessageHistoryLoader] Failed to load timeline:', err);
					setHistoryLoadDisabled(roomId, false);
				});
		}
	}, [roomId, historyLoadedDisabled, currentUserId, setHistoryLoadDisabled, setInitialTimelineLoaded, setHasMoreBefore, setHistoryIsFullyLoaded]);

	useEffect(() => {
		if (messageListRef?.current && messageHistoryLoaderRef?.current) {
			intersectionObserverRef.current = new IntersectionObserver(
				([entry]) => {
					if (entry.intersectionRatio === 1) {
						handleHistoryLoader();
					}
				},
				{ root: messageListRef.current, rootMargin: '0px', threshold: 1 }
			);
			intersectionObserverRef.current.observe(messageHistoryLoaderRef.current);
		}
		return (): void => intersectionObserverRef.current?.disconnect();
	}, [handleHistoryLoader, messageHistoryLoaderRef, messageListRef]);

	return (
		<VisibilityContainer data-testid={'messageHistoryLoader'} ref={messageHistoryLoaderRef}>
			<Loader>
				<Icon icon="RefreshOutline" size="medium" />
			</Loader>
		</VisibilityContainer>
	);
};

export default MessageHistoryLoader;
