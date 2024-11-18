/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useState, useMemo } from 'react';

import { Badge, Button, Container, Padding } from '@zextras/carbonio-design-system';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useEventListener, { EventName, NewMessageEvent } from '../../../hooks/useEventListener';
import { getRoomMutedSelector } from '../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import { getRoomUnreadsSelector } from '../../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../../store/Store';
import { MessageType } from '../../../types/store/MessageTypes';

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
	const unreadCount = useStore((store) => getRoomUnreadsSelector(store, roomId));
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const myUserId = useStore(getUserId);

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

	return (
		<CustomContainer height="fit" width="fit" orientation="horizontal" onClick={onClickCb}>
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
				onClick={onClickCb}
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
