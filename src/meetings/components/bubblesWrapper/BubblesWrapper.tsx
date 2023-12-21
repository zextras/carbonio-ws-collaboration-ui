/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { map, pull } from 'lodash';
import styled from 'styled-components';

import MeetingBubble from './MeetingBubble';
import useEventListener, { EventName } from '../../../hooks/useEventListener';
import { MessageType } from '../../../types/store/MessageTypes';

const WrapperContainer = styled(Container)<{ $messageIdsList: string[] }>`
	position: absolute;
	top: 3.3125rem;
	left: 4.25rem;
	z-index: 3;
	width: ${({ $messageIdsList }): string => ($messageIdsList.length !== 0 ? '23.125rem' : '0')};
`;

const BubblesWrapper = (): JSX.Element => {
	const [messageIdsList, setMessageIdsList] = useState<string[]>([]);

	const newMessageHandler = useCallback(({ detail: messageFromEvent }) => {
		if (messageFromEvent.type === MessageType.TEXT_MSG) {
			setMessageIdsList((oldState) => [messageFromEvent.id, ...oldState]);
		}
	}, []);

	const handleBubbleRemove = useCallback((messageIdToRemove: string) => {
		setMessageIdsList((oldState) => {
			const newState = [...oldState];
			pull(newState, messageIdToRemove);
			return newState;
		});
	}, []);

	const Bubbles = useMemo(
		() =>
			map(messageIdsList, (messageId) => (
				<MeetingBubble
					messageId={messageId}
					handleBubbleRemove={handleBubbleRemove}
					key={messageId}
				/>
			)),
		[handleBubbleRemove, messageIdsList]
	);

	useEventListener(EventName.NEW_MESSAGE, newMessageHandler);

	return (
		<WrapperContainer
			mainAlignment={'flex-start'}
			crossAlignment={'flex-start'}
			$messageIdsList={messageIdsList}
		>
			{Bubbles}
		</WrapperContainer>
	);
};

export default BubblesWrapper;
