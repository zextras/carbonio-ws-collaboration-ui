/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useState, useMemo } from 'react';

import styled from '@emotion/styled';
import { Badge, Button, Container, Padding } from '@zextras/carbonio-design-system';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';

import useEventListener, { EventName, NewMessageEvent } from '../../../hooks/useEventListener';
import ChatApi from '../../../network/apis/ChatApi';
import {
	mapReadMarkersToMarkers,
	mapReactionsToFastenings,
	mapTimelineItemsToMessages
} from '../../../network/sse/utilities/messageMapper';
import { getRoomUnreadSelector } from '../../../store/selectors/ChatsRegistrySelectors';
import { getRoomMutedSelector } from '../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { MessageFastening, MessageType } from '../../../types/store/ChatsRegistryTypes';

type ScrollButtonProps = {
	roomId: string;
	onClickCb: () => void;
};

const CustomContainer = styled(Container)`
	position: absolute;
	z-index: 10;
	right: 0.875rem;
	bottom: 0.875rem;
	cursor: pointer;
`;

export const ScrollBadge = styled(Badge)`
	position: absolute;
	right: -0.25rem;
	bottom: -0.25rem;
	padding: 0 0.425rem;
	font-size: 0.6rem;
`;

const ScrollButton = ({ roomId, onClickCb }: ScrollButtonProps): ReactElement => {
	const unreadCount = useStore((store) => getRoomUnreadSelector(store, roomId));
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const myUserId = useStore(getUserId);
	const hasMoreAfter = useStore((store) => store.chatsRegistry[roomId]?.hasMoreAfter ?? false);

	const [t] = useTranslation();
	const buttonLabel = t('action.scrollToBottom', 'Scroll to bottom');
	const newMessageHasArrivedLabel = t('conversation.newMessage', 'New message');
	const newMessagesHaveArrivedLabel = t('conversation.newMessages', 'New messages');

	// Handle "There are new messages" badge
	const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedNewMessagesBadgeSetter = useCallback(
		debounce(() => setShowNewMessageBadge(false), 3000),
		[]
	);

	const newMessageEventHandler = useCallback(
		(event: CustomEvent<NewMessageEvent['data']> | undefined) => {
			if (
				event?.detail.roomId === roomId &&
				event?.detail.type === MessageType.TEXT_MSG &&
				event?.detail.from !== myUserId
			) {
				setShowNewMessageBadge(true);
				debouncedNewMessagesBadgeSetter();
			}
		},
		[debouncedNewMessagesBadgeSetter, myUserId, roomId]
	);

	const labelNewMessages = useMemo(
		() => (unreadCount === 1 ? newMessageHasArrivedLabel : newMessagesHaveArrivedLabel),
		[newMessageHasArrivedLabel, newMessagesHaveArrivedLabel, unreadCount]
	);

	useEventListener(EventName.NEW_MESSAGE, newMessageEventHandler);

	// Handle click: if fragmented, reload from latest; otherwise just scroll
	const handleClick = useCallback(() => {
		if (!hasMoreAfter) {
			// Not fragmented - just scroll to bottom
			onClickCb();
			return;
		}

		// Fragmented state - reload from latest
		const store = useStore.getState();
		const currentUserId = getUserId(store) || '';

		// Set loading flags BEFORE clearing messages to prevent loaders from triggering
		store.setIsLoadingTimeline(roomId, true);
		store.setHistoryLoadDisabled(roomId, true);

		// Clear current messages and reset pagination state
		store.clearMessages(roomId);

		// Load fresh latest messages (no cursor = most recent)
		ChatApi.getTimeline(roomId, { limit: 50 })
			.then((response) => {
				const markers =
					response.markers && response.markers.length > 0
						? mapReadMarkersToMarkers(response.markers)
						: undefined;

				if (response.items.length > 0) {
					const messages = mapTimelineItemsToMessages(response.items, roomId, currentUserId);
					store.updateHistory(roomId, messages, markers);

					// Extract and add reactions as fastenings
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

				// We're now at the latest page
				store.setHasMoreBefore(roomId, response.hasMoreBefore);
				store.setHasMoreAfter(roomId, false);

				// Re-enable history loader if there are more messages before
				if (response.hasMoreBefore) {
					store.setHistoryLoadDisabled(roomId, false);
				}

				// Use the original callback to scroll to bottom
				requestAnimationFrame(() => {
					onClickCb();
				});
			})
			.catch((err) => {
				console.error('[ScrollButton] Failed to load timeline:', err);
				// Re-enable loading on error so user can retry
				store.setHistoryLoadDisabled(roomId, false);
			})
			.finally(() => {
				// Clear loading flag
				store.setIsLoadingTimeline(roomId, false);
			});
	}, [hasMoreAfter, onClickCb, roomId]);

	return (
		<CustomContainer height="fit" width="fit" orientation="horizontal" onClick={handleClick}>
			{showNewMessageBadge && (
				<Badge
					data-testid="scrollButton-unreadCount"
					value={labelNewMessages}
					backgroundColor={!roomMuted ? 'primary' : 'gray2'}
					color={!roomMuted ? 'gray6' : 'gray0'}
				/>
			)}
			<Padding horizontal="extrasmall" />
			<Button
				data-testid={'scrollButton'}
				type="outlined"
				title={buttonLabel}
				shape="round"
				icon="ArrowheadDownOutline"
				color="primary"
				onClick={handleClick}
			/>
			{unreadCount > 0 && (
				<ScrollBadge
					value={unreadCount}
					backgroundColor={!roomMuted ? 'primary' : 'gray2'}
					color={!roomMuted ? 'gray6' : 'gray0'}
				/>
			)}
		</CustomContainer>
	);
};

export default ScrollButton;
