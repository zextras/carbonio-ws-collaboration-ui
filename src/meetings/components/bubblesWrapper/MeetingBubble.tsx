/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import AttachmentView from '../../../chats/components/conversation/messageBubbles/AttachmentView';
import BubbleFooter from '../../../chats/components/conversation/messageBubbles/BubbleFooter';
import BubbleHeader from '../../../chats/components/conversation/messageBubbles/BubbleHeader';
import ForwardInfo from '../../../chats/components/conversation/messageBubbles/ForwardInfo';
import RepliedTextMessageSectionView from '../../../chats/components/conversation/messageBubbles/RepliedTextMessageSectionView';
import TextContentBubble from '../../../chats/components/conversation/messageBubbles/TextContentBubble';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getMeetingChatVisibility } from '../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId } from '../../../store/selectors/MeetingSelectors';
import {
	getMessageAttachment,
	getMessageSelector
} from '../../../store/selectors/MessagesSelectors';
import { getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { MeetingChatVisibility } from '../../../types/store/ActiveMeetingTypes';
import { MessageType } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { getAttachmentInfo } from '../../../utils/attachmentUtils';
import { parseUrlOnMessage } from '../../../utils/parseUrlOnMessage';

const BubbleContainer = styled(Container)<{
	$messageAttachment: boolean;
}>`
	margin-top: 0.25rem;
	margin-bottom: 0.25rem;
	${({ $messageAttachment }): string | false => !$messageAttachment && 'width: fit-content;'};
	box-shadow: 0 0 0.625rem rgba(0, 0, 0, 0.3);
	border-radius: 0 0.25rem 0.25rem 0;
`;

type MeetingBubbleProps = {
	messageId: string;
	setMessageIdToRemove: Dispatch<SetStateAction<string>>;
};

const MeetingBubble: FC<MeetingBubbleProps> = ({ messageId, setMessageIdToRemove }) => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const message = useStore((store) => getMessageSelector(store, roomId || '', messageId));
	const roomType = useStore<RoomType>((store) => getRoomTypeSelector(store, roomId || ''));
	const messageAttachment = useStore((store) => getMessageAttachment(store, message));
	const setMeetingSidebarStatus = useStore((store) => store.setMeetingSidebarStatus);
	const meetingChatVisibility = useStore((store) => getMeetingChatVisibility(store, meetingId));
	const setMeetingChatVisibility = useStore((store) => store.setMeetingChatVisibility);

	const { extension, size } = getAttachmentInfo(
		messageAttachment?.mimeType,
		messageAttachment?.size
	);

	const messageFormatted = useMemo(
		() => message?.type === MessageType.TEXT_MSG && parseUrlOnMessage(message.text),
		[message]
	);

	const onClickHandler = useCallback(() => {
		setMeetingSidebarStatus(meetingId, true);
		if (meetingChatVisibility === MeetingChatVisibility.CLOSED) {
			setMeetingChatVisibility(meetingId, MeetingChatVisibility.OPEN);
		}
	}, [meetingChatVisibility, meetingId, setMeetingChatVisibility, setMeetingSidebarStatus]);

	useEffect(() => {
		setTimeout(() => {
			setMessageIdToRemove(messageId);
		}, 3000);
	}, [messageId, setMessageIdToRemove]);

	return message?.type === MessageType.TEXT_MSG ? (
		<BubbleContainer
			id={`message-${messageId}`}
			data-testid={`Bubble-${messageId}`}
			key={messageId}
			height="fit"
			width="fit"
			padding={{ all: 'medium' }}
			background={'gray0'}
			$messageAttachment={messageAttachment !== undefined}
			onClick={onClickHandler}
		>
			{roomType !== RoomType.ONE_TO_ONE && (
				<>
					<BubbleHeader senderId={message.from} />
					<Padding bottom="small" />
				</>
			)}
			{message.forwarded && <ForwardInfo info={message.forwarded} />}
			{message.repliedMessage && (
				<RepliedTextMessageSectionView
					repliedMessageRef={message.repliedMessage}
					isMyMessage={false}
				/>
			)}
			{messageAttachment && (
				<>
					<AttachmentView attachment={messageAttachment} isMyMessage={false} from={message.from} />
					<Padding bottom="0.5rem" />
				</>
			)}
			<TextContentBubble textContent={messageFormatted || ''} />
			<BubbleFooter
				isMyMessage={false}
				date={message.date}
				messageRead={message.read}
				isEdited={message?.edited}
				messageExtension={extension}
				messageSize={size}
			/>
		</BubbleContainer>
	) : null;
};

export default MeetingBubble;
