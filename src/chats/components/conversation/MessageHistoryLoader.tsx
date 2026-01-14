/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useRef } from 'react';

import styled from '@emotion/styled';
import { Icon } from '@zextras/carbonio-design-system';
import { debounce, first } from 'lodash';

import ChatApi from '../../../network/apis/ChatApi';
import {
	mapReadMarkersToMarkers,
	mapReactionsToFastenings,
	mapTimelineItemsToMessages
} from '../../../network/sse/utilities/messageMapper';
import { MessageFastening } from '../../../types/store/ChatsRegistryTypes';
import {
	getHistoryIsLoadedDisabled,
	getIsInitialTimelineLoaded
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

type MessageHistoryLoaderProps = {
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

const MessageHistoryLoader = ({
	roomId,
	messageListRef
}: MessageHistoryLoaderProps): ReactElement => {
	const intersectionObserverRef = useRef<IntersectionObserver>();
	const messageHistoryLoaderRef = React.createRef<HTMLDivElement>();

	const historyLoadedDisabled = useStore((store) => getHistoryIsLoadedDisabled(store, roomId));
	const isInitialTimelineLoaded = useStore((store) => getIsInitialTimelineLoaded(store, roomId));
	const setHistoryLoadDisabled = useStore((store) => store.setHistoryLoadDisabled);
	const setInitialTimelineLoaded = useStore((store) => store.setInitialTimelineLoaded);
	const updateHistory = useStore((store) => store.updateHistory);
	const addFastening = useStore((store) => store.addFastening);
	const currentUserId = useStore(getUserId);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const handleHistoryLoader = useCallback(
		debounce(() => {
			const store = useStore.getState();
			const roomMessages = store.chatsRegistry[roomId]?.messages;
			const initialLoaded = store.activeConversations[roomId]?.isInitialTimelineLoaded;

			// For initial load, don't pass 'before' to get most recent messages
			// For subsequent loads (scrolling up), use oldest message date
			let beforeDate: string | undefined;
			if (initialLoaded && roomMessages && roomMessages.length > 0) {
				const oldestMessageDate = first(roomMessages)?.date;
				if (oldestMessageDate) {
					beforeDate = new Date(oldestMessageDate).toISOString();
				}
			}

			// Skip timeline loading for placeholder rooms (room doesn't exist yet)
			if (roomId.startsWith('placeholder-')) return;

			if (!historyLoadedDisabled) {
				setHistoryLoadDisabled(roomId, true);
				ChatApi.getTimeline(roomId, beforeDate, 50)
					.then((response) => {
						// Convert markers first (needed for atomic update)
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
							// Use updateHistory with markers for atomic update (messages + read status)
							updateHistory(roomId, messages, markers);

							// Extract reactions from timeline messages and add them as fastenings
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
						} else if (markers) {
							// Even if no new items, update markers if present
							updateHistory(roomId, [], markers);
						}

						// Mark initial timeline as loaded after first successful load
						if (!initialLoaded) {
							setInitialTimelineLoaded(roomId);
						}

						// Only enable loading more if there are more items
						// Otherwise keep it disabled (already set to true above)
						if (response.hasMore) {
							setHistoryLoadDisabled(roomId, false);
						}
					})
					.catch((err) => {
						console.error('[MessageHistoryLoader] Failed to load timeline:', err);
						setHistoryLoadDisabled(roomId, false);
					});
			}
		}, 500),
		[roomId, historyLoadedDisabled, currentUserId]
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
