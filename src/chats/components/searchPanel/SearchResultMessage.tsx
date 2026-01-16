/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import styled from '@emotion/styled';
import { Container, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import HighlightedText from './HighlightedText';
import useAvatarUtilities from '../../../hooks/useAvatarUtilities';
import ChatApi from '../../../network/apis/ChatApi';
import {
	mapReadMarkersToMarkers,
	mapReactionsToFastenings,
	mapTimelineItemsToMessages
} from '../../../network/sse/utilities/messageMapper';
import {
	getIsMessageSelected,
	getIsMessageSelectedAlreadyStored
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getIsLoggedUser, getUserId } from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { MessageFastening, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { formatDate } from '../../../utils/dateUtils';
import { scrollToMessage } from '../../../utils/scrollUtils';

const CustomContainer = styled(Container)`
	border-radius: 0.25rem;
	border: 1px solid ${({ theme }): string => theme.palette.gray3.regular};
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
	cursor: pointer;
	&:hover {
		background: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

interface SearchResultMessageProps {
	message: TextMessage;
	searchText: string;
}

const SearchResultMessage = ({
	message,
	searchText
}: SearchResultMessageProps): React.ReactElement => {
	const senderIsLoggedUser = useStore((store) => getIsLoggedUser(store, message.from));
	const senderName = useStore((store) => getUserName(store, message.from));
	const isMessageSelected = useStore((state) =>
		getIsMessageSelected(state, message.roomId, message.stanzaId)
	);
	const isMessageSelectedAlreadyStored = useStore((state) =>
		getIsMessageSelectedAlreadyStored(state, message.roomId, message.stanzaId)
	);

	const [t] = useTranslation();
	const youLabel = t('status.you', 'You');

	const { avatarColor } = useAvatarUtilities(message.from);

	const onResultClick = useCallback(() => {
		const store = useStore.getState();
		store.setSelectedSearchResult(message.roomId, message.stanzaId);

		// Set loading flags BEFORE clearing messages to prevent loaders from triggering
		store.setIsLoadingTimeline(message.roomId, true);
		store.setHistoryLoadDisabled(message.roomId, true);

		// Clear existing messages and load around the search result
		// This ensures we have a clean contiguous block of messages
		store.clearMessages(message.roomId);

		const aroundDate = new Date(message.date).toISOString();
		const currentUserId = getUserId(store) || '';

		ChatApi.getTimeline(message.roomId, { around: aroundDate, limit: 50 })
			.then((response) => {
				const markers =
					response.markers && response.markers.length > 0
						? mapReadMarkersToMarkers(response.markers)
						: undefined;

				// Set scroll position BEFORE updating history
				// This ensures the useEffect in MessagesList doesn't scroll to bottom
				store.setScrollPosition(message.roomId, message.id);

				if (response.items.length > 0) {
					const messages = mapTimelineItemsToMessages(
						response.items,
						message.roomId,
						currentUserId
					);
					store.updateHistory(message.roomId, messages, markers);

					// Extract and add reactions as fastenings
					const allFastenings: MessageFastening[] = [];
					response.items.forEach((item) => {
						if (item.itemType === 'message' && item.message.reactions) {
							const fastenings = mapReactionsToFastenings(
								item.message.id,
								message.roomId,
								item.message.reactions
							);
							allFastenings.push(...fastenings);
						}
					});
					if (allFastenings.length > 0) {
						store.addFastening(allFastenings);
					}
				} else if (markers) {
					store.updateHistory(message.roomId, [], markers);
				}

				// Update bidirectional pagination flags
				store.setHasMoreBefore(message.roomId, response.hasMoreBefore);
				store.setHasMoreAfter(message.roomId, response.hasMoreAfter);

				// Re-enable history loader if there are more messages before
				// (otherwise keep it disabled to prevent duplicate loads)
				if (response.hasMoreBefore) {
					store.setHistoryLoadDisabled(message.roomId, false);
				}

				// Scroll to the searched message after DOM update
				// IMPORTANT: Keep isLoadingTimeline=true until scroll is complete and DOM is stable
				// This prevents HistoryLoaderAfter from triggering immediately
				requestAnimationFrame(() => {
					scrollToMessage(message.id);

					// Wait for scroll to complete and DOM to stabilize before allowing loaders
					// Use a longer delay to ensure IntersectionObserver debounce (500ms) doesn't
					// trigger with stale state
					setTimeout(() => {
						store.setIsLoadingTimeline(message.roomId, false);
					}, 600);
				});
			})
			.catch((err) => {
				console.error('[SearchResultMessage] Failed to load timeline:', err);
				// Re-enable loading on error so user can retry
				store.setHistoryLoadDisabled(message.roomId, false);
				store.setIsLoadingTimeline(message.roomId, false);
			});
	}, [message]);

	return (
		<CustomContainer
			height="fit"
			crossAlignment="flex-start"
			padding="small"
			gap="0.5rem"
			onClick={onResultClick}
			background={isMessageSelected ? 'highlight' : 'transparent'}
		>
			<Row width="fill">
				<Row takeAvailableSpace mainAlignment="flex-start">
					<Text color={avatarColor} weight="bold">
						{senderIsLoggedUser ? youLabel : senderName}
					</Text>
				</Row>
				<Text color="secondary" size="small">
					{formatDate(message.date, 'DD/MM/YYYY - HH:mm')}
				</Text>
			</Row>
			<Row takeAvailableSpace>
				<HighlightedText text={message.text} searchText={searchText} />
			</Row>
		</CustomContainer>
	);
};
export default SearchResultMessage;
