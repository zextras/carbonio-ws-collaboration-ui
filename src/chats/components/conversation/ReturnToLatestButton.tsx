/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import styled from '@emotion/styled';
import { Button, Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ChatApi from '../../../network/apis/ChatApi';
import {
	mapReadMarkersToMarkers,
	mapReactionsToFastenings,
	mapTimelineItemsToMessages
} from '../../../network/utils/messageMapper';
import { getIsMongooseIM } from '../../../store/selectors/ConnectionSelector';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { MessageFastening } from '../../../types/store/ChatsRegistryTypes';
import { scrollToEnd } from '../../../utils/scrollUtils';

const ButtonContainer = styled(Container)`
	position: absolute;
	bottom: 4rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 10;
`;

type ReturnToLatestButtonProps = {
	roomId: string;
	messagesListWrapperRef: React.RefObject<HTMLDivElement>;
};

const ReturnToLatestButton = ({
	roomId,
	messagesListWrapperRef
}: ReturnToLatestButtonProps): React.ReactElement | null => {
	const [t] = useTranslation();
	const hasMoreAfter = useStore((store) => store.chatsRegistry[roomId]?.hasMoreAfter ?? false);

	const handleClick = useCallback(() => {
		if (getIsMongooseIM(useStore.getState())) return;

		const store = useStore.getState();
		const currentUserId = getUserId(store) || '';

		store.clearMessages(roomId);
		store.setSelectedSearchResult(roomId, undefined);

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

				// Scroll to bottom
				requestAnimationFrame(() => {
					scrollToEnd(messagesListWrapperRef);
				});
			})
			.catch((err) => {
				console.error('[ReturnToLatestButton] Failed to load timeline:', err);
			});
	}, [roomId, messagesListWrapperRef]);

	// Only show if viewing historical page (hasMoreAfter === true)
	if (!hasMoreAfter) {
		return null;
	}

	return (
		<ButtonContainer>
			<Button
				type="outlined"
				color="primary"
				onClick={handleClick}
				icon="ArrowDown"
				iconPlacement="right"
				label={t('chat.returnToLatest', 'Return to latest')}
			/>
		</ButtonContainer>
	);
};

export default ReturnToLatestButton;
