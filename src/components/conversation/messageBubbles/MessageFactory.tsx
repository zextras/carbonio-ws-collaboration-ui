/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { getSingleMessageSelector } from '../../../store/selectors/MessagesSelectors';
import useStore from '../../../store/Store';
import AffiliationBubble from './AffiliationBubble';
import Bubble from './Bubble';
import ConfigurationBubble from './ConfigurationBubble';
import DateBubble from './DataBubble';

type MessageProps = {
	messageId: string;
	messageRoomId: string;
	prevMessageIsFromSameSender: boolean;
	nextMessageIsFromSameSender: boolean;
	messageRef: React.RefObject<HTMLElement>;
};

export const CustomMessage = styled(Container)`
	width: fit-content;
	white-space: pre-wrap;
	word-break: break-word;
	max-width: 80%;
	height: auto;
	margin: 0.625rem;
	padding: 0.25em 1em;
	${({ dateMessage }): string =>
		dateMessage && 'border-radius: 1rem; box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);'}
	margin: 0.625rem auto;
	cursor: default;
	-webkit-user-select: none;
	user-select: none;
	text-align: center;
	background-color: ${({ theme, dateMessage }): string =>
		dateMessage ? theme.palette.gray6.regular : theme.palette.gray5.regular}; ;
`;

const MessageFactory = ({
	messageId,
	messageRoomId,
	prevMessageIsFromSameSender,
	nextMessageIsFromSameSender,
	messageRef
}: MessageProps): ReactElement => {
	const message = useStore((store) => getSingleMessageSelector(store, messageRoomId, messageId));

	if (message) {
		switch (message.type) {
			case 'text': {
				return (
					<Bubble
						message={message}
						prevMessageIsFromSameSender={prevMessageIsFromSameSender}
						nextMessageIsFromSameSender={nextMessageIsFromSameSender}
						messageRef={messageRef}
					/>
				);
			}
			case 'affiliation': {
				return <AffiliationBubble message={message} refEl={messageRef} />;
			}
			case 'configuration': {
				return <ConfigurationBubble message={message} refEl={messageRef} />;
			}
			case 'date': {
				return <DateBubble message={message} refEl={messageRef} />;
			}
			default: {
				return <div>Errore</div>;
			}
		}
	}
	return <div>Errore</div>;
};

export default MessageFactory;
