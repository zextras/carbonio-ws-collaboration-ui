/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { FunctionComponent, useEffect } from 'react';
import styled from 'styled-components';

import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import {
	getFistMessageOfHistory,
	getMessageSelector
} from '../../../store/selectors/MessagesSelectors';
import { getUsersSelector } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { Message, TextMessage } from '../../../types/store/MessageTypes';

const RepliedMessageContainer = styled(Container)`
	height: auto;
	margin: 0.3125rem 0;
	border: 0.0625rem solid gray;
	padding: 0.3125rem;
`;

type RepliedMessageProps = {
	roomId: string;
	replyTo: string;
};

const RepliedMessage: FunctionComponent<RepliedMessageProps> = ({ roomId, replyTo }) => {
	const xmppClient = useStore(getXmppClient);

	// Retrieve data from store
	const users = useStore(getUsersSelector);
	const firstMessage = useStore((state) => getFistMessageOfHistory(state, roomId));
	const repliedMessage = useStore<Message | undefined>((state) =>
		getMessageSelector(state, roomId, replyTo)
	) as TextMessage;

	// If replied message is not present in the loaded history, request history from that message
	useEffect(() => {
		if (repliedMessage == null) {
			// TODO xmpp history request for replied message doesn't work
			xmppClient.requestHistoryBetweenTwoMessage(roomId, replyTo, firstMessage.id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<RepliedMessageContainer crossAlignment="flex-start">
			{repliedMessage ? (
				<>
					<Text size={'small'} color={'gray1'}>
						{users[repliedMessage.from]?.name}
					</Text>
					{repliedMessage.text}
				</>
			) : (
				<Text size={'small'} color={'gray1'}>
					{' '}
					Message not found
				</Text>
			)}
		</RepliedMessageContainer>
	);
};

export default RepliedMessage;
