/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import { Container, Padding } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';

import AttachmentView from './AttachmentView';
import BubbleContextualMenuDropDown, {
	BubbleContextualMenuDropDownWrapper
} from './BubbleContextualMenuDropDown';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';
import ForwardedTextMessageSectionView from './ForwardedMessageSectionView';
import RepliedTextMessageSectionView from './RepliedTextMessageSectionView';
import TextContentBubble from './TextContentBubble';
import { getMessageAttachment } from '../../../../store/selectors/MessagesSelectors';
import { getRoomTypeSelector } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { Z_INDEX_RANK } from '../../../../types/generics';
import { MarkerStatus } from '../../../../types/store/MarkersTypes';
import { TextMessage } from '../../../../types/store/MessageTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { parseUrlOnMessage } from '../../../../utils/parseUrlOnMessage';

type BubbleProps = {
	message: TextMessage;
	prevMessageIsFromSameSender: boolean;
	nextMessageIsFromSameSender: boolean;
	messageRef: React.RefObject<HTMLElement>;
	messageListRef?: React.MutableRefObject<HTMLDivElement | undefined>;
};

const DropDownWrapper = styled(Container)`
	position: relative;
	z-index: ${Z_INDEX_RANK.DROPDOWN_CXT};
`;

const BubbleContainer = styled(Container)`
	margin-top: 0.25rem;
	margin-bottom: 0.25rem;
	${({ messageAttachment }): string | false => !messageAttachment && 'width: fit-content;'};
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
	messageRef,
	messageListRef
}) => {
	const mySessionId = useStore((store) => store.session.id);
	const roomType = useStore<RoomType>((store) => getRoomTypeSelector(store, message.roomId));
	const isMyMessage = mySessionId === message.from;
	const messageAttachment = useStore((store) => getMessageAttachment(store, message));
	const messageFormatted = useMemo(() => parseUrlOnMessage(message.text), [message.text]);

	const extension = useMemo(
		() => messageAttachment && messageAttachment.mimeType.split('/')[1]?.toUpperCase(),
		[messageAttachment]
	);

	const size = useMemo(() => {
		if (messageAttachment) {
			if (messageAttachment.size < 1024) {
				return `${messageAttachment.size}B`;
			}
			if (messageAttachment.size < 1024 * 1024) {
				return `${(messageAttachment.size / 1024).toFixed(2)}KB`;
			}
			if (messageAttachment.size < 1024 * 1024 * 1024) {
				return `${(messageAttachment.size / 1024 / 1024).toFixed(2)}MB`;
			}
			return `${(messageAttachment.size / 1024 / 1024 / 1024).toFixed(2)}GB`;
		}
		return undefined;
	}, [messageAttachment]);

	return (
		<BubbleContainer
			id={`message-${message.id}`}
			ref={messageRef}
			data-testid={`Bubble-${message.id}`}
			key={message.id}
			height="fit"
			width="fit"
			maxWidth={messageAttachment && !message.forwarded ? '60%' : '75%'}
			padding={{ all: 'medium' }}
			background={isMyMessage ? 'highlight' : 'gray6'}
			isMyMessage={isMyMessage}
			firstMessageOfList={!prevMessageIsFromSameSender && nextMessageIsFromSameSender}
			centerMessageOfList={prevMessageIsFromSameSender && nextMessageIsFromSameSender}
			lastMessageOfList={prevMessageIsFromSameSender && !nextMessageIsFromSameSender}
			messageAttachment={messageAttachment !== undefined}
		>
			{message.read !== MarkerStatus.PENDING && (
				<DropDownWrapper padding={{ all: 'none' }}>
					<BubbleContextualMenuDropDown message={message} isMyMessage={isMyMessage} />
				</DropDownWrapper>
			)}
			{!isMyMessage && roomType !== RoomType.ONE_TO_ONE && !prevMessageIsFromSameSender && (
				<>
					<BubbleHeader senderId={message.from} />
					<Padding bottom="small" />
				</>
			)}
			{message.repliedMessage && (
				<RepliedTextMessageSectionView
					repliedMessageRef={message.repliedMessage}
					isMyMessage={isMyMessage}
				/>
			)}
			{message.forwarded && (
				<ForwardedTextMessageSectionView
					message={message}
					forwardedInfo={message.forwarded}
					isMyMessage={isMyMessage}
				/>
			)}
			{messageAttachment && !message.forwarded && (
				<>
					<AttachmentView
						attachment={messageAttachment}
						isMyMessage={isMyMessage}
						from={message.from}
						messageListRef={messageListRef}
					/>
					<Padding bottom="0.5rem" />
				</>
			)}
			{!message.forwarded && <TextContentBubble textContent={messageFormatted} />}
			<BubbleFooter
				isMyMessage={isMyMessage}
				date={message.date}
				messageRead={message.read}
				forwarded={message.forwarded}
				isEdited={message?.edited}
				messageExtension={extension}
				messageSize={size}
			/>
		</BubbleContainer>
	);
};

export default Bubble;
