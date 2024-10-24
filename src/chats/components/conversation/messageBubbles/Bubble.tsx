/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import {
	Checkbox,
	Container,
	CreateSnackbarFn,
	Padding,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { SimpleInterpolation } from 'styled-components';

import AttachmentView from './AttachmentView';
import BubbleActions, { BubbleActionsWrapper } from './bubbleActions/BubbleActions';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';
import ForwardInfo from './ForwardInfo';
import MessageReactionsList from './MessageReactionsList';
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
		${BubbleActionsWrapper} {
			opacity: 1;
		}
	}
	border-radius: ${({
		$isMyMessage,
		$firstMessageOfList,
		$centerMessageOfList,
		$lastMessageOfList
	}): string => {
		if ($isMyMessage) {
			if ($firstMessageOfList) return '0.25rem 0.25rem 0 0.25rem';
			return $centerMessageOfList || $lastMessageOfList
				? '0.25rem 0 0 0.25rem'
				: '0.25rem 0 0.25rem 0.25rem';
		}
		if ($firstMessageOfList) return '0 0.25rem 0.25rem 0';
		return $centerMessageOfList ? '0 0.25rem 0.25rem 0' : '0 0.25rem 0.25rem 0.25rem';
	}};
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
		'You have reached the maximum number of messages that can be forwarded at one time. Deselect a message to change your choice.'
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
				severity: 'info',
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
		return (): void => {
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

	const bubbleDropdownShouldBeVisible = useMemo(
		() => message.read !== MarkerStatus.PENDING && forwardMessageList === undefined,
		[forwardMessageList, message.read]
	);

	const checkboxShouldBeVisible = useMemo(
		() => forwardMessageList !== undefined && forwardMessageList.length !== 0,
		[forwardMessageList]
	);

	return (
		<ForwardContainer
			orientation="horizontal"
			width="fill"
			mainAlignment="space-between"
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
				crossAlignment="flex-start"
				maxWidth={messageAttachment && !message.forwarded ? '60%' : '75%'}
				padding={{ all: 'medium' }}
				background={isMyMessage ? 'highlight' : 'gray6'}
				$isMyMessage={isMyMessage}
				$firstMessageOfList={!prevMessageIsFromSameSender && nextMessageIsFromSameSender}
				$centerMessageOfList={prevMessageIsFromSameSender && nextMessageIsFromSameSender}
				$lastMessageOfList={prevMessageIsFromSameSender && !nextMessageIsFromSameSender}
				$messageAttachment={messageAttachment !== undefined}
			>
				{bubbleDropdownShouldBeVisible && (
					<BubbleActions message={message} isMyMessage={isMyMessage} />
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
					<Padding bottom="0.5rem">
						<AttachmentView
							attachment={messageAttachment}
							isMyMessage={isMyMessage}
							from={message.from}
							messageListRef={messageListRef}
						/>
					</Padding>
				)}
				<TextContentBubble textContent={messageFormatted} />
				{messageAttachment && (
					<MessageReactionsList roomId={message.roomId} stanzaId={message.stanzaId} />
				)}
				<BubbleFooter
					isMyMessage={isMyMessage}
					date={message.date}
					messageRead={message.read}
					isEdited={message?.edited}
					messageExtension={extension}
					messageSize={size}
					canSeeMessageReads={canSeeMessageReads}
					showReactions={!messageAttachment}
					roomId={message.roomId}
					stanzaId={message.stanzaId}
				/>
			</BubbleContainer>
			{checkboxShouldBeVisible && (
				<Container padding={{ left: '0.5rem' }} width="fit">
					<Checkbox
						defaultChecked={messageInForwardList}
						value={messageInForwardList}
						iconColor={messageInForwardList ? 'primary' : 'gray0'}
						disabled={!isForwardLimitNotReached && !messageInForwardList}
					/>
				</Container>
			)}
		</ForwardContainer>
	);
};

export default Bubble;
