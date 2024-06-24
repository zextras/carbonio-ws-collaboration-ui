/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Avatar, Container, Spinner, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ConfigurationMessageLabel } from '../../../hooks/useConfigurationMessageLabel';
import useMessage from '../../../hooks/useMessage';
import { getLastMessageIdSelector } from '../../../store/selectors/MessagesSelectors';
import {
	getRoomNameSelector,
	getRoomTypeSelector,
	getRoomURLPicture
} from '../../../store/selectors/RoomsSelectors';
import { getExportedChat, getUserId } from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { Message, MessageType } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const CustomContainer = styled(Container)`
	border-radius: 4px;
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
`;

type ChatItemProps = {
	roomId: string;
	onClick: () => void;
};

const ChatItem: React.FC<ChatItemProps> = ({ roomId, onClick }: ChatItemProps) => {
	const [t] = useTranslation();
	const deletedMessageLabel = t('message.deletedMessage', 'Deleted message');

	const picture = useStore((state) => getRoomURLPicture(state, roomId));
	const roomName = useStore((store) => getRoomNameSelector(store, roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const exportedChat = useStore(getExportedChat);
	const lastMessageId = useStore((state) => getLastMessageIdSelector(state, roomId));
	const lastMessageOfRoom: Message | undefined = useMessage(roomId, lastMessageId ?? '');
	const userNameOfLastMessageOfRoom = useStore((store) =>
		lastMessageOfRoom?.type === MessageType.TEXT_MSG
			? getUserName(store, lastMessageOfRoom.from)
			: ''
	);
	const loggedUserId = useStore(getUserId);

	const messageToDisplay = useMemo(() => {
		switch (lastMessageOfRoom?.type) {
			case MessageType.TEXT_MSG: {
				if (lastMessageOfRoom.deleted) return deletedMessageLabel;
				const text =
					lastMessageOfRoom.attachment && lastMessageOfRoom.text === ''
						? lastMessageOfRoom.attachment.name
						: lastMessageOfRoom.text;
				if (lastMessageOfRoom.from === loggedUserId) return text;
				return `${userNameOfLastMessageOfRoom.split(/(\s+)/)[0]}: ${text}`;
			}
			case MessageType.CONFIGURATION_MSG:
				return <ConfigurationMessageLabel message={lastMessageOfRoom} />;
			case MessageType.DATE_MSG:
			default:
				return '';
		}
	}, [deletedMessageLabel, lastMessageOfRoom, loggedUserId, userNameOfLastMessageOfRoom]);

	return (
		<CustomContainer
			orientation="horizontal"
			onClick={onClick}
			padding={{ all: 'small' }}
			gap="0.5rem"
		>
			<Avatar
				label={roomName}
				picture={picture}
				shape={roomType === RoomType.ONE_TO_ONE ? 'round' : 'square'}
			/>
			<Container width="fill" crossAlignment="flex-start">
				<Text size="small">{roomName}</Text>
				<Text color="secondary" size="extrasmall" overflow="ellipsis">
					{messageToDisplay}
				</Text>
			</Container>
			{exportedChat === roomId && <Spinner color="gray1" />}
		</CustomContainer>
	);
};

export default ChatItem;
