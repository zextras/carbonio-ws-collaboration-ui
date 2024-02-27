/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { Container, CreateSnackbarFn, Padding, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { SimpleInterpolation } from 'styled-components';

import AttachmentView from './AttachmentView';
import BubbleContextualMenuDropDown, {
	BubbleContextualMenuDropDownWrapper
} from './BubbleContextualMenuDropDown';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';
import ForwardInfo from './ForwardInfo';
import RepliedTextMessageSectionView from './RepliedTextMessageSectionView';
import TextContentBubble from './TextContentBubble';
import {
	getForwardList,
	isMessageInForwardList,
	maxForwardLimitNotReached
} from '../../../../store/selectors/ActiveConversationsSelectors';
import { getMessageAttachment } from '../../../../store/selectors/MessagesSelectors';
import { getRoomTypeSelector } from '../../../../store/selectors/RoomsSelectors';
import { getCapability } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { Z_INDEX_RANK } from '../../../../types/generics';
import { MarkerStatus } from '../../../../types/store/MarkersTypes';
import { TextMessage } from '../../../../types/store/MessageTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { CapabilityType } from '../../../../types/store/SessionTypes';
import { getAttachmentInfo } from '../../../../utils/attachmentUtils';
import { parseUrlOnMessage } from '../../../../utils/parseUrlOnMessage';

type BubbleProps = {
	message: TextMessage;
	prevMessageIsFromSameSender: boolean;
	nextMessageIsFromSameSender: boolean;
	messageRef: React.RefObject<HTMLDivElement>;
	messageListRef?: React.RefObject<HTMLDivElement | undefined>;
};

const DropDownWrapper = styled(Container)`
	position: relative;
	z-index: ${Z_INDEX_RANK.DROPDOWN_CXT};
`;

const ForwardContainer = styled(Container)<{
	$forwardIsActive: boolean;
	$hoverIsActive: boolean;
}>`
	border-radius: 0;
	padding-left: 0.4375rem;
	padding-right: 0.4375rem;
	${({ $forwardIsActive }): string | false =>
		$forwardIsActive && 'background: rgba(213, 227, 246, 0.50); cursor: pointer;'};
	&:hover {
		${({ $hoverIsActive }): string | false =>
			$hoverIsActive && 'background: rgba(230, 230, 230, 0.50); cursor: pointer;'};
	}
`;

const BubbleContainer = styled(Container)<{
	$isMyMessage: boolean;
	$messageAttachment: boolean;
	$firstMessageOfList: boolean;
	$centerMessageOfList: boolean;
	$lastMessageOfList: boolean;
}>`
	margin-top: 0.25rem;
	margin-bottom: 0.25rem;
	${({ $messageAttachment }): string | false => !$messageAttachment && 'width: fit-content;'};
	${({ $isMyMessage }): SimpleInterpolation => $isMyMessage && 'margin-left: auto;'};
	box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);

	&:hover {
		${BubbleContextualMenuDropDownWrapper} {
			opacity: 1;
		}
	}
	border-radius: ${({
		$isMyMessage,
		$firstMessageOfList,
		$centerMessageOfList,
		$lastMessageOfList
	}): string =>
		$isMyMessage
			? $firstMessageOfList
				? '0.25rem 0.25rem 0 0.25rem'
				: $centerMessageOfList || $lastMessageOfList
					? '0.25rem 0 0 0.25rem'
					: '0.25rem 0 0.25rem 0.25rem'
			: $firstMessageOfList
				? '0 0.25rem 0.25rem 0'
				: $centerMessageOfList
					? '0 0.25rem 0.25rem 0'
					: '0 0.25rem 0.25rem 0.25rem'};
`;

const Bubble: FC<BubbleProps> = ({
	message,
	prevMessageIsFromSameSender,
	nextMessageIsFromSameSender,
	messageRef,
	messageListRef
}) => {
	const [t] = useTranslation();
	const maxNumberReached = t(
		'conversation.selectionMode.maxSelected',
		'The maximum number of messages that can be forwarded at the same time has been reached'
	);

	const mySessionId = useStore((store) => store.session.id);
	const roomType = useStore<RoomType>((store) => getRoomTypeSelector(store, message.roomId));
	const isMyMessage = mySessionId === message.from;
	const messageAttachment = useStore((store) => getMessageAttachment(store, message));
	const messageFormatted = useMemo(() => parseUrlOnMessage(message.text), [message.text]);
	const forwardMessageList = useStore((store) => getForwardList(store, message.roomId));
	const setForwardList = useStore((store) => store.setForwardMessageList);
	const isForwardLimitNotReached: boolean = useStore((store) =>
		maxForwardLimitNotReached(store, message.roomId)
	);
	const unsetForwardMessageList = useStore((store) => store.unsetForwardMessageList);
	const messageInForwardList: boolean = useStore((store) =>
		isMessageInForwardList(store, message.roomId, message)
	);
	const canSeeMessageReads = useStore((store) =>
		getCapability(store, CapabilityType.CAN_SEE_MESSAGE_READS)
	);

	const forwardContainerRef = useRef<HTMLDivElement>(null);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const { extension, size } = getAttachmentInfo(
		messageAttachment?.mimeType,
		messageAttachment?.size
	);

	const handleAddForwardMessage = useCallback(() => {
		if (messageInForwardList) {
			unsetForwardMessageList(message.roomId, message);
		} else if (!isForwardLimitNotReached) {
			createSnackbar({
				key: new Date().toLocaleString(),
				type: 'warning',
				label: maxNumberReached,
				hideButton: true,
				autoHideTimeout: 3000
			});
		} else {
			setForwardList(message.roomId, message);
		}
	}, [
		createSnackbar,
		isForwardLimitNotReached,
		maxNumberReached,
		message,
		messageInForwardList,
		setForwardList,
		unsetForwardMessageList
	]);

	useEffect(() => {
		let refValue: HTMLDivElement | null = null;
		if (forwardMessageList !== undefined && forwardContainerRef.current) {
			forwardContainerRef.current.addEventListener('click', handleAddForwardMessage);
			refValue = forwardContainerRef.current;
		}
		return () => {
			if (refValue) {
				refValue.removeEventListener('click', handleAddForwardMessage);
			}
		};
	}, [forwardMessageList, handleAddForwardMessage, messageRef]);

	const forwardIsActive = useMemo(
		() => forwardMessageList !== undefined && messageInForwardList,
		[forwardMessageList, messageInForwardList]
	);

	const hoverIsActive = useMemo(
		() => forwardMessageList !== undefined && !messageInForwardList && isForwardLimitNotReached,
		[forwardMessageList, isForwardLimitNotReached, messageInForwardList]
	);

	return (
		<ForwardContainer
			width="fill"
			crossAlignment="flex-start"
			ref={forwardContainerRef}
			$forwardIsActive={forwardIsActive}
			$hoverIsActive={hoverIsActive}
			data-testid="forward_bubble_container"
		>
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
				$isMyMessage={isMyMessage}
				$firstMessageOfList={!prevMessageIsFromSameSender && nextMessageIsFromSameSender}
				$centerMessageOfList={prevMessageIsFromSameSender && nextMessageIsFromSameSender}
				$lastMessageOfList={prevMessageIsFromSameSender && !nextMessageIsFromSameSender}
				$messageAttachment={messageAttachment !== undefined}
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
				{message.forwarded && <ForwardInfo info={message.forwarded} />}
				{message.repliedMessage && (
					<RepliedTextMessageSectionView
						repliedMessageRef={message.repliedMessage}
						isMyMessage={isMyMessage}
					/>
				)}
				{messageAttachment && (
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
				<TextContentBubble textContent={messageFormatted} />
				<BubbleFooter
					isMyMessage={isMyMessage}
					date={message.date}
					messageRead={message.read}
					isEdited={message?.edited}
					messageExtension={extension}
					messageSize={size}
					canSeeMessageReads={canSeeMessageReads}
				/>
			</BubbleContainer>
		</ForwardContainer>
	);
};

export default Bubble;
