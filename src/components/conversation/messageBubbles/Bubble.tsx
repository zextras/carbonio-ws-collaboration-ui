/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import { Container } from '@zextras/carbonio-design-system';
import React, { FC, ReactElement } from 'react';
import styled from 'styled-components';

import { TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import BubbleContextualMenuDropDown, {
	BubbleContextualMenuDropDownWrapper
} from './BubbleContextualMenuDropDown';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';
import RepliedTextMessageSectionView from './RepliedTextMessageSectionView';
import TextContentBubble from './TextContentBubble';

type BubbleProps = {
	refEl: React.RefObject<HTMLElement>;
	isMyMessage: boolean;
	senderInfo: string | null; // name | email | id(fallback)
	message: TextMessage;
	messageTime: string;
	messageFormatted: string | (string | ReactElement)[];
	prevMessageIsFromSameSender: boolean;
	nextMessageIsFromSameSender: boolean;
	roomType: RoomType;
	userColor: string;
};

const DropDownWrapper = styled(Container)`
	position: relative;
`;

const BubbleContainer = styled(Container)`
	margin-top: 0.25rem;
	margin-bottom: 0.25rem;
	${({ isMyMessage }): string => isMyMessage && 'margin-left: auto;'};
	box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);

	&:hover {
		${BubbleContextualMenuDropDownWrapper} {
			opacity: 1;
		}
	}
	border-radius: ${({
		isMyMessage,
		firstMessageOfList,
		centerMessageOfList,
		lastMessageOfList
	}): string =>
		isMyMessage
			? firstMessageOfList
				? '0.25rem 0.25rem 0 0.25rem'
				: centerMessageOfList || lastMessageOfList
				? '0.25rem 0 0 0.25rem'
				: '0.25rem 0 0.25rem 0.25rem'
			: firstMessageOfList
			? '0 0.25rem 0.25rem 0'
			: centerMessageOfList
			? '0 0.25rem 0.25rem 0'
			: lastMessageOfList
			? '0 0.25rem 0.25rem 0.25rem'
			: '0 0.25rem 0.25rem 0.25rem'};
`;

const Bubble: FC<BubbleProps> = ({
	refEl,
	isMyMessage,
	senderInfo,
	message,
	messageTime,
	messageFormatted,
	prevMessageIsFromSameSender,
	nextMessageIsFromSameSender,
	roomType,
	userColor
}) => (
	<BubbleContainer
		id={`message-${message.id}`}
		ref={refEl}
		data-testid={`Bubble-${message.id}`}
		key={`${message.id}`}
		height="fit"
		width="fit"
		maxWidth="75%"
		padding={{ all: 'medium' }}
		background={isMyMessage ? 'highlight' : 'gray6'}
		isMyMessage={isMyMessage}
		firstMessageOfList={!prevMessageIsFromSameSender && nextMessageIsFromSameSender}
		centerMessageOfList={prevMessageIsFromSameSender && nextMessageIsFromSameSender}
		lastMessageOfList={prevMessageIsFromSameSender && !nextMessageIsFromSameSender}
	>
		<DropDownWrapper padding={{ top: '0.25rem' }}>
			{message.type === 'text' && (
				<BubbleContextualMenuDropDown message={message} isMyMessage={isMyMessage} />
			)}
		</DropDownWrapper>
		{!isMyMessage &&
			roomType !== RoomType.ONE_TO_ONE &&
			senderInfo &&
			!prevMessageIsFromSameSender && (
				<BubbleHeader
					senderIdentifier={senderInfo}
					notReplayedMessageHeader
					userColor={userColor}
				/>
			)}
		{message.repliedMessage && (
			<RepliedTextMessageSectionView
				repliedMessage={message.repliedMessage}
				roomId={message.roomId}
				isMyMessage={isMyMessage}
			/>
		)}
		{message.type === 'text' && <TextContentBubble textContent={messageFormatted} />}
		<BubbleFooter isMyMessage={isMyMessage} time={messageTime} messageRead={message.read} />
	</BubbleContainer>
);

export default Bubble;
