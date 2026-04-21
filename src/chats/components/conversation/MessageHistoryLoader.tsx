/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useRef } from 'react';

import styled from '@emotion/styled';
import { Icon } from '@zextras/carbonio-design-system';
import { debounce, first, last } from 'lodash';

import ChatApi from '../../../network/apis/ChatApi';
import { scrollToMessage } from '../../../utils/scrollUtils';
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
	scrollContainerRef: React.RefObject<HTMLDivElement>;
};

const Loader = styled.div`
	background-color: ${({ theme }): string => theme.palette.gray6.active};
	color: #999;
	text-align: center;
	border-radius: 50%;
	margin: 0.875rem auto;
	width: 1.75rem;
	height: 1.75rem;

	@-moz-keyframes spin {
		0% {
			transform: scaleX(-1) rotate(0deg);
		}
		100% {
			transform: scaleX(-1) rotate(360deg);
		}
	}
	@-webkit-keyframes spin {
		0% {
			transform: scaleX(-1) rotate(0deg);
		}
		100% {
			transform: scaleX(-1) rotate(360deg);
		}
	}
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
		-webkit-animation: spin 1s linear infinite;
		-moz-animation: spin 1s linear infinite;
		animation: spin 1s linear infinite;
	}
`;

const VisibilityContainer = styled.div`
	width: 100%;
	text-align: center;
`;

/**
 * Loader for OLDER messages (appears at the top of the message list).
 * Triggers when user scrolls up to load more history.
 * This loader is used after the initial load and for scrolling back in time.
 */
export const HistoryLoaderBefore = ({
	roomId,
	messageListRef,
	scrollContainerRef
}: HistoryLoaderProps): ReactElement | null => {
	const intersectionObserverRef = useRef<IntersectionObserver>();
	const loaderRef = React.createRef<HTMLDivElement>();
	const isLoadingRef = useRef(false);

	const hasMoreBefore = useStore((store) => store.chatsRegistry[roomId]?.hasMoreBefore ?? true);
	const isLoadingTimeline = useStore(
		(store) => store.chatsRegistry[roomId]?.isLoadingTimeline ?? false
	);
	const setHasMoreBefore = useStore((store) => store.setHasMoreBefore);
	const setIsLoadingTimeline = useStore((store) => store.setIsLoadingTimeline);
	const updateHistory = useStore((store) => store.updateHistory);
	const addFastening = useStore((store) => store.addFastening);
	const currentUserId = useStore(getUserId);

	const handleLoadBefore = useCallback(
		debounce(() => {
			// Don't trigger if already loading or if another timeline call is in progress
			if (isLoadingRef.current) return;
			if (useStore.getState().chatsRegistry[roomId]?.isLoadingTimeline) return;
			if (roomId.startsWith('placeholder-')) return;

			const store = useStore.getState();
			const roomMessages = store.chatsRegistry[roomId]?.messages;

			if (!roomMessages || roomMessages.length === 0) return;

			const oldestMessage = first(roomMessages);
			const beforeDate = oldestMessage ? new Date(oldestMessage.date).toISOString() : undefined;

			// Save scroll state before loading for scroll anchoring
			const scrollContainer = scrollContainerRef?.current;
			const scrollHeightBefore = scrollContainer?.scrollHeight || 0;
			const scrollTopBefore = scrollContainer?.scrollTop || 0;

			isLoadingRef.current = true;
			// Set isLoadingTimeline to prevent other effects from scrolling during pagination
			setIsLoadingTimeline(roomId, true);

			ChatApi.getTimeline(roomId, { before: beforeDate, limit: 50 })
				.then((response) => {
					const markers =
						response.markers && response.markers.length > 0
							? mapReadMarkersToMarkers(response.markers)
							: undefined;

					if (response.items.length > 0) {
						const messages = mapTimelineItemsToMessages(
							response.items,
							roomId,
							currentUserId || ''
						);
						updateHistory(roomId, messages, markers);

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
							addFastening(allFastenings);
						}

						// Scroll anchoring: maintain visual position after adding content above
						// Use double requestAnimationFrame to ensure DOM is updated
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								if (scrollContainer) {
									const scrollHeightAfter = scrollContainer.scrollHeight;
									const heightDiff = scrollHeightAfter - scrollHeightBefore;
									scrollContainer.scrollTop = scrollTopBefore + heightDiff;
								}
								setIsLoadingTimeline(roomId, false);
							});
						});
					} else {
						if (markers) {
							updateHistory(roomId, [], markers);
						}
						setIsLoadingTimeline(roomId, false);
					}

					setHasMoreBefore(roomId, response.hasMoreBefore);
				})
				.catch((err) => {
					console.error('[HistoryLoaderBefore] Failed to load:', err);
					setIsLoadingTimeline(roomId, false);
				})
				.finally(() => {
					isLoadingRef.current = false;
				});
		}, 500),
		[roomId, currentUserId, setHasMoreBefore, setIsLoadingTimeline, updateHistory, addFastening, scrollContainerRef]
	);

	useEffect(() => {
		if (messageListRef?.current && loaderRef?.current) {
			intersectionObserverRef.current = new IntersectionObserver(
				([entry]) => {
					if (entry.intersectionRatio === 1) {
						handleLoadBefore.cancel();
						handleLoadBefore();
					}
				},
				{ root: messageListRef.current, rootMargin: '0px', threshold: 1 }
			);
			intersectionObserverRef.current.observe(loaderRef.current);
		}
		return (): void => intersectionObserverRef.current?.disconnect();
	}, [handleLoadBefore, loaderRef, messageListRef]);

	// Don't show if no more to load or if a timeline call is in progress
	if (!hasMoreBefore || isLoadingTimeline) return null;

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
 * Triggers when user scrolls down after jumping to a search result.
 */
export const HistoryLoaderAfter = ({
	roomId,
	messageListRef,
	scrollContainerRef
}: HistoryLoaderProps): ReactElement | null => {
	const intersectionObserverRef = useRef<IntersectionObserver>();
	const loaderRef = React.createRef<HTMLDivElement>();
	const isLoadingRef = useRef(false);

	const hasMoreAfter = useStore((store) => store.chatsRegistry[roomId]?.hasMoreAfter ?? false);
	const isLoadingTimeline = useStore(
		(store) => store.chatsRegistry[roomId]?.isLoadingTimeline ?? false
	);
	const setHasMoreAfter = useStore((store) => store.setHasMoreAfter);
	const setIsLoadingTimeline = useStore((store) => store.setIsLoadingTimeline);
	const updateHistory = useStore((store) => store.updateHistory);
	const addFastening = useStore((store) => store.addFastening);
	const currentUserId = useStore(getUserId);

	const handleLoadAfter = useCallback(
		debounce(() => {
			// Don't trigger if already loading or if another timeline call is in progress
			if (isLoadingRef.current) return;
			if (useStore.getState().chatsRegistry[roomId]?.isLoadingTimeline) return;
			if (roomId.startsWith('placeholder-')) return;

			const store = useStore.getState();
			const roomMessages = store.chatsRegistry[roomId]?.messages;

			if (!roomMessages || roomMessages.length === 0) return;

			const newestMessage = last(roomMessages);
			const afterDate = newestMessage ? new Date(newestMessage.date).toISOString() : undefined;

			// Save the anchor message ID - we'll scroll to this message after loading
			// to maintain the user's position when new content is added below
			const anchorMessageId = newestMessage?.id;

			isLoadingRef.current = true;
			// Set isLoadingTimeline to prevent other effects from scrolling during pagination
			setIsLoadingTimeline(roomId, true);

			ChatApi.getTimeline(roomId, { after: afterDate, limit: 50 })
				.then((response) => {
					const markers =
						response.markers && response.markers.length > 0
							? mapReadMarkersToMarkers(response.markers)
							: undefined;

					if (response.items.length > 0) {
						const messages = mapTimelineItemsToMessages(
							response.items,
							roomId,
							currentUserId || ''
						);
						updateHistory(roomId, messages, markers);

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
							addFastening(allFastenings);
						}

						// Scroll anchoring: scroll to the anchor message to maintain position
						// Use double requestAnimationFrame to ensure DOM is fully updated
						// and all React effects have completed
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								if (anchorMessageId) {
									scrollToMessage(anchorMessageId, 'end');
								}
								// Reset isLoadingTimeline after scroll is complete
								setIsLoadingTimeline(roomId, false);
							});
						});
					} else {
						if (markers) {
							updateHistory(roomId, [], markers);
						}
						setIsLoadingTimeline(roomId, false);
					}

					setHasMoreAfter(roomId, response.hasMoreAfter);
				})
				.catch((err) => {
					console.error('[HistoryLoaderAfter] Failed to load:', err);
					setIsLoadingTimeline(roomId, false);
				})
				.finally(() => {
					isLoadingRef.current = false;
				});
		}, 500),
		[roomId, currentUserId, setHasMoreAfter, updateHistory, addFastening]
	);

	useEffect(() => {
		if (messageListRef?.current && loaderRef?.current) {
			intersectionObserverRef.current = new IntersectionObserver(
				([entry]) => {
					if (entry.intersectionRatio === 1) {
						handleLoadAfter.cancel();
						handleLoadAfter();
					}
				},
				{ root: messageListRef.current, rootMargin: '0px', threshold: 1 }
			);
			intersectionObserverRef.current.observe(loaderRef.current);
		}
		return (): void => intersectionObserverRef.current?.disconnect();
	}, [handleLoadAfter, loaderRef, messageListRef]);

	// Don't show if no more to load or if a timeline call is in progress
	if (!hasMoreAfter || isLoadingTimeline) return null;

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
	messageListRef,
	scrollContainerRef
}: HistoryLoaderProps): ReactElement | null => {
	const intersectionObserverRef = useRef<IntersectionObserver>();
	const messageHistoryLoaderRef = React.createRef<HTMLDivElement>();

	const historyLoadedDisabled = useStore((store) => getHistoryIsLoadedDisabled(store, roomId));
	const isInitialTimelineLoaded = useStore((store) => getIsInitialTimelineLoaded(store, roomId));
	const setHistoryLoadDisabled = useStore((store) => store.setHistoryLoadDisabled);
	const setInitialTimelineLoaded = useStore((store) => store.setInitialTimelineLoaded);
	const setHasMoreBefore = useStore((store) => store.setHasMoreBefore);
	const setHasMoreAfter = useStore((store) => store.setHasMoreAfter);
	const setIsLoadingTimeline = useStore((store) => store.setIsLoadingTimeline);
	const updateHistory = useStore((store) => store.updateHistory);
	const addFastening = useStore((store) => store.addFastening);
	const currentUserId = useStore(getUserId);

	const handleHistoryLoader = useCallback(
		debounce(() => {
			const store = useStore.getState();

			// Don't trigger if another timeline call is in progress (e.g., from search result navigation)
			if (store.chatsRegistry[roomId]?.isLoadingTimeline) return;

			const roomMessages = store.chatsRegistry[roomId]?.messages;
			const initialLoaded = store.activeConversations[roomId]?.isInitialTimelineLoaded;

			// Always use 'before' based on oldest message if messages exist (e.g., from inbox)
			// This ensures we load older messages and the spinner shows above existing ones
			let beforeDate: string | undefined;
			const hasExistingMessages = roomMessages && roomMessages.length > 0;
			if (hasExistingMessages) {
				const oldestMessageDate = first(roomMessages)?.date;
				if (oldestMessageDate) {
					beforeDate = new Date(oldestMessageDate).toISOString();
				}
			}

			if (roomId.startsWith('placeholder-')) return;

			// Save scroll state before loading for scroll anchoring (only when loading more history)
			const scrollContainer = scrollContainerRef?.current;
			const scrollHeightBefore = scrollContainer?.scrollHeight || 0;
			const scrollTopBefore = scrollContainer?.scrollTop || 0;

			if (!historyLoadedDisabled) {
				setHistoryLoadDisabled(roomId, true);
				setIsLoadingTimeline(roomId, true);
				ChatApi.getTimeline(roomId, { before: beforeDate, limit: 50 })
					.then((response) => {
						const markers =
							response.markers && response.markers.length > 0
								? mapReadMarkersToMarkers(response.markers)
								: undefined;

						if (response.items.length > 0) {
							const messages = mapTimelineItemsToMessages(
								response.items,
								roomId,
								currentUserId || ''
							);
							updateHistory(roomId, messages, markers);

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
								addFastening(allFastenings);
							}

							// Scroll anchoring: maintain visual position after adding content above
							// Use double requestAnimationFrame to ensure DOM is updated
							requestAnimationFrame(() => {
								requestAnimationFrame(() => {
									// Only apply scroll anchoring when loading more history (not initial load)
									if (hasExistingMessages && scrollContainer) {
										const scrollHeightAfter = scrollContainer.scrollHeight;
										const heightDiff = scrollHeightAfter - scrollHeightBefore;
										scrollContainer.scrollTop = scrollTopBefore + heightDiff;
									}
									setIsLoadingTimeline(roomId, false);
								});
							});
						} else {
							if (markers) {
								updateHistory(roomId, [], markers);
							}
							setIsLoadingTimeline(roomId, false);
						}

						if (!initialLoaded) {
							setInitialTimelineLoaded(roomId);
						}

						// Update hasMoreBefore based on response
						setHasMoreBefore(roomId, response.hasMoreBefore);
						// Don't set hasMoreAfter here - this loader only loads older messages.
						// We know we're at the "latest" point because we started from inbox.
						// hasMoreAfter should only be true after navigating to a search result.

						// Enable history loader if there's more to load
						if (response.hasMoreBefore) {
							setHistoryLoadDisabled(roomId, false);
						}
					})
					.catch((err) => {
						console.error('[MessageHistoryLoader] Failed to load timeline:', err);
						setHistoryLoadDisabled(roomId, false);
						setIsLoadingTimeline(roomId, false);
					});
			}
		}, 500),
		[roomId, historyLoadedDisabled, currentUserId, scrollContainerRef]
	);

	useEffect(() => {
		if (messageListRef?.current && messageHistoryLoaderRef?.current) {
			intersectionObserverRef.current = new IntersectionObserver(
				([entry]) => {
					if (entry.intersectionRatio === 1) {
						handleHistoryLoader.cancel();
						handleHistoryLoader();
					}
				},
				{
					root: messageListRef.current,
					rootMargin: '0px',
					threshold: 1
				}
			);
			intersectionObserverRef.current.observe(messageHistoryLoaderRef.current);
		}
		return (): void => intersectionObserverRef.current?.disconnect();
	}, [handleHistoryLoader, messageHistoryLoaderRef, messageListRef]);

	// Hide the loader when history is fully loaded (no more items to fetch)
	if (historyLoadedDisabled) {
		return null;
	}

	return (
		<VisibilityContainer data-testid={'messageHistoryLoader'} ref={messageHistoryLoaderRef}>
			<Loader>
				<Icon icon="RefreshOutline" size="medium" />
			</Loader>
		</VisibilityContainer>
	);
};

export default MessageHistoryLoader;
