/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import { Container, Padding } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';

import { getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { parseUrlOnMessage } from '../../../utils/parseUrlOnMessage';
import BubbleContextualMenuDropDown, {
	BubbleContextualMenuDropDownWrapper
} from './BubbleContextualMenuDropDown';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';
import ForwardedTextMessageSectionView from './ForwardedMessageSectionView';
import RepliedTextMessageSectionView from './RepliedTextMessageSectionView';
import TextContentBubble from './TextContentBubble';

type BubbleProps = {
	message: TextMessage;
	prevMessageIsFromSameSender: boolean;
	nextMessageIsFromSameSender: boolean;
	messageRef: React.RefObject<HTMLElement>;
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
	message,
	prevMessageIsFromSameSender,
	nextMessageIsFromSameSender,
	messageRef
}) => {
	const mySessionId = useStore((store) => store.session.id);
	const roomType = useStore<RoomType>((store) => getRoomTypeSelector(store, message.roomId));
	const isMyMessage = mySessionId === message.from;
	const messageFormatted = useMemo(() => parseUrlOnMessage(message.text), [message.text]);

	return (
		<BubbleContainer
			id={`message-${message.id}`}
			ref={messageRef}
			data-testid={`Bubble-${message.id}`}
			key={message.id}
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
			<DropDownWrapper padding={{ all: 'none' }}>
				<BubbleContextualMenuDropDown message={message} isMyMessage={isMyMessage} />
			</DropDownWrapper>
			{!isMyMessage && roomType !== RoomType.ONE_TO_ONE && !prevMessageIsFromSameSender && (
				<>
					<BubbleHeader senderId={message.from} />
					<Padding bottom="small" />
				</>
			)}
			{message.repliedMessage && (
				<RepliedTextMessageSectionView
					repliedMessage={message.repliedMessage}
					roomId={message.roomId}
					isMyMessage={isMyMessage}
				/>
			)}
			{message.forwarded && (
				<ForwardedTextMessageSectionView
					forwardedMessage={message.forwarded}
					isMyMessage={isMyMessage}
					roomId={message.roomId}
				/>
			)}
			<TextContentBubble textContent={messageFormatted} />
			<BubbleFooter
				isMyMessage={isMyMessage}
				date={message.date}
				messageRead={message.read}
				forwarded={message.forwarded}
			/>
		</BubbleContainer>
	);
};

export default Bubble;
