/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import Bubble from './Bubble';
import ConfigurationBubble from './ConfigurationBubble';
import DateBubble from './DateBubble';
import DeletedBubble from './DeletedBubble';
import useMessage from '../../../../hooks/useMessage';
import { MessageType } from '../../../../types/store/MessageTypes';

type MessageProps = {
	messageId: string;
	messageRoomId: string;
	prevMessageIsFromSameSender: boolean;
	nextMessageIsFromSameSender: boolean;
	messageRef: React.RefObject<HTMLDivElement>;
	isFirstNewMessage: boolean;
	messageListRef?: React.RefObject<HTMLDivElement | undefined>;
};

export const CustomMessage = styled(Container)`
	width: fit-content;
	white-space: pre-wrap;
	word-break: break-word;
	max-width: 80%;
	height: auto;
	padding: 0.25em 1em;
	margin: 0.625rem auto;
	cursor: default;
	user-select: none;
	-webkit-user-select: none;
	text-align: center;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
`;

const MessageFactory = ({
	messageId,
	messageRoomId,
	prevMessageIsFromSameSender,
	nextMessageIsFromSameSender,
	messageRef,
	isFirstNewMessage,
	messageListRef
}: MessageProps): ReactElement => {
	const [t] = useTranslation();
	const newMessagesLabel = t('conversation.newMessages', 'New messages');

	const message = useMessage(messageRoomId, messageId);

	const newMessagesComponent = useMemo(
		() => (
			<CustomMessage
				mainAlignment={'flex-start'}
				crossAlignment={'flex-start'}
				borderColor="gray3"
				data-testid={`new_msg`}
			>
				<Text color="gray1">{newMessagesLabel}</Text>
			</CustomMessage>
		),
		[newMessagesLabel]
	);

	if (message) {
		switch (message.type) {
			case MessageType.TEXT_MSG: {
				return (
					<>
						{isFirstNewMessage && newMessagesComponent}
						{message.deleted ? (
							<DeletedBubble message={message} refEl={messageRef} />
						) : (
							<Bubble
								message={message}
								prevMessageIsFromSameSender={prevMessageIsFromSameSender}
								nextMessageIsFromSameSender={nextMessageIsFromSameSender}
								messageRef={messageRef}
								messageListRef={messageListRef}
							/>
						)}
					</>
				);
			}
			case MessageType.CONFIGURATION_MSG: {
				return (
					<>
						{isFirstNewMessage && newMessagesComponent}
						<ConfigurationBubble message={message} refEl={messageRef} />
					</>
				);
			}
			case MessageType.DATE_MSG: {
				return <DateBubble message={message} refEl={messageRef} messageListRef={messageListRef} />;
			}
			default: {
				return <div>Message not handled</div>;
			}
		}
	}
	return <div>Message not handled</div>;
};

export default MessageFactory;
