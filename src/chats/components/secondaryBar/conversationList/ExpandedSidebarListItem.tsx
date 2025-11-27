/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Badge, Container, Icon, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ConfigurationMessageLabel } from '../../../../hooks/useConfigurationMessageLabel';
import { useIsWritingLabel } from '../../../../hooks/useIsWritingLabel';
import useMessage from '../../../../hooks/useMessage';
import useRouting from '../../../../hooks/useRouting';
import {
	getDraftMessage,
	getLastNewReaction
} from '../../../../store/selectors/ActiveConversationsSelectors';
import {
	getLastMessageIdSelector,
	getRoomUnreadSelector
} from '../../../../store/selectors/ChatsRegistrySelectors';
import {
	getRoomMutedSelector,
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import {
	getAttribute,
	getSelectedConversation
} from '../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { MarkerStatus, Message, MessageType } from '../../../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import GroupAvatar from '../../GroupAvatar';
import UserAvatar from '../../UserAvatar';

type ExpandedSidebarListItemProps = {
	roomId: string;
};

const ListItem = styled(Container)<{ $selected: boolean }>`
	cursor: pointer;
	&:hover {
		background-color: ${({ $selected, theme }): string =>
			$selected ? theme.palette.highlight.regular : theme.palette.gray3.regular};
	}
	-webkit-user-select: none;
	user-select: none;
`;

const ExpandedSidebarListItem: React.FC<ExpandedSidebarListItemProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const draftLabel = t('message.draft', 'draft');
	const deletedMessageLabel = t('message.deletedMessage', 'Deleted message');

	const { goToRoomPage } = useRouting();

	const sessionId: string | undefined = useStore((store) => store.session.id);
	const lastMessageId: string | undefined = useStore((state) =>
		getLastMessageIdSelector(state, roomId)
	);
	const lastMessageOfRoom: Message | undefined = useMessage(roomId, lastMessageId ?? '');
	const unreadMessagesCount = useStore((store) => getRoomUnreadSelector(store, roomId));
	const lastNewReaction = useStore((store) => getLastNewReaction(store, roomId));
	const roomType = useStore((state) => getRoomTypeSelector(state, roomId));
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const isConversationSelected = useStore((state) => getSelectedConversation(state, roomId));
	const userNameOfLastMessageOfRoom = useStore((store) =>
		lastMessageOfRoom && lastMessageOfRoom.type === MessageType.TEXT_MSG
			? getUserName(store, lastMessageOfRoom.from)
			: ''
	);
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));
	const canSeeMessageReads = useStore((store) => getAttribute(store, 'showMessageReads'));

	const isWritingLabel = useIsWritingLabel(roomId, true);

	const ackIcon = useMemo(() => {
		if (
			lastMessageOfRoom &&
			lastMessageOfRoom.type === MessageType.TEXT_MSG &&
			!lastMessageOfRoom.deleted &&
			lastMessageOfRoom.from === sessionId
		) {
			switch (lastMessageOfRoom.read) {
				case MarkerStatus.READ:
					return <Icon size="small" icon="DoneAll" color="primary" />;
				case MarkerStatus.READ_BY_SOMEONE:
					return <Icon size="small" icon="DoneAll" color="gray" />;
				case MarkerStatus.UNREAD:
					return <Icon size="small" icon="Checkmark" color="gray" />;
				case MarkerStatus.PENDING:
					return <Icon size="small" icon="ClockOutline" color="gray" />;
				default:
					return <Icon size="small" icon="Checkmark" color="gray" />;
			}
		}
		return undefined;
	}, [lastMessageOfRoom, sessionId]);

	const dropdownTooltip = useMemo(() => {
		if (
			lastMessageOfRoom &&
			lastMessageOfRoom.type === MessageType.TEXT_MSG &&
			!lastMessageOfRoom.deleted
		) {
			switch (lastMessageOfRoom.read) {
				case MarkerStatus.UNREAD:
					return t('tooltip.messageSent', 'Sent');
				case MarkerStatus.READ:
					return t('tooltip.messageRead', 'Read');
				default:
					return t('tooltip.messageReceived', 'Received');
			}
		}
		return '';
	}, [lastMessageOfRoom, t]);

	const draftTooltip = useMemo(
		() => `${draftLabel.toUpperCase()}: ${draftMessage}`,
		[draftMessage, draftLabel]
	);

	const showMessageReads = useMemo(
		() =>
			canSeeMessageReads ||
			(lastMessageOfRoom &&
				lastMessageOfRoom.type === MessageType.TEXT_MSG &&
				lastMessageOfRoom.read === MarkerStatus.PENDING),
		[canSeeMessageReads, lastMessageOfRoom]
	);

	const setLastMessageRoomText = useMemo(() => {
		if (lastMessageOfRoom) {
			switch (lastMessageOfRoom.type) {
				case MessageType.TEXT_MSG: {
					if (lastMessageOfRoom.deleted) {
						return deletedMessageLabel;
					}
					const text =
						lastMessageOfRoom.attachment && lastMessageOfRoom.text === ''
							? lastMessageOfRoom.attachment.name
							: lastMessageOfRoom.text;
					if (roomType === RoomType.GROUP && lastMessageOfRoom.from !== sessionId) {
						return `${userNameOfLastMessageOfRoom.split(/(\s+)/)[0]}: ${text}`;
					}
					return text;
				}
				case MessageType.CONFIGURATION_MSG:
					return <ConfigurationMessageLabel message={lastMessageOfRoom} />;
				default:
					console.error('Message to replace: ', lastMessageOfRoom.type);
					return '';
			}
		}
		return undefined;
	}, [deletedMessageLabel, lastMessageOfRoom, roomType, sessionId, userNameOfLastMessageOfRoom]);

	const iconToDisplay = useMemo(() => {
		if (isWritingLabel) return null;

		if (draftMessage && unreadMessagesCount === 0) {
			return (
				<Tooltip label={draftTooltip} maxWidth="12.5rem">
					<Container width="fit" padding={{ right: 'extrasmall' }}>
						<Icon size="small" icon="Edit2" color="gray" />
					</Container>
				</Tooltip>
			);
		}

		if (ackIcon && showMessageReads) {
			return (
				<Tooltip label={dropdownTooltip}>
					<Container width="fit" padding={{ right: 'extrasmall' }}>
						{ackIcon}
					</Container>
				</Tooltip>
			);
		}

		if (lastMessageOfRoom?.type === MessageType.TEXT_MSG && lastMessageOfRoom.attachment) {
			return (
				<Container width="fit" padding={{ right: 'extrasmall' }}>
					<Icon size="small" icon="FileTextOutline" color="gray" />
				</Container>
			);
		}
		return null;
	}, [
		isWritingLabel,
		draftMessage,
		unreadMessagesCount,
		ackIcon,
		showMessageReads,
		lastMessageOfRoom,
		draftTooltip,
		dropdownTooltip
	]);

	const messageToDisplay = useMemo((): React.JSX.Element | string | undefined => {
		if (isWritingLabel) {
			return isWritingLabel;
		}
		if (draftMessage && unreadMessagesCount === 0) {
			return draftMessage;
		}
		if (lastMessageOfRoom) {
			return setLastMessageRoomText;
		}
		return undefined;
	}, [
		draftMessage,
		isWritingLabel,
		lastMessageOfRoom,
		setLastMessageRoomText,
		unreadMessagesCount
	]);

	const UnreadCounter = useMemo(
		() =>
			unreadMessagesCount > 0 || lastNewReaction ? (
				<Row padding={{ left: 'small' }} mainAlignment="center" crossAlignment="center">
					<Badge
						value={unreadMessagesCount > 0 ? unreadMessagesCount : lastNewReaction}
						backgroundColor={!roomMuted ? 'primary' : 'gray2'}
						color={!roomMuted ? 'gray6' : 'gray0'}
					/>
				</Row>
			) : null,
		[unreadMessagesCount, lastNewReaction, roomMuted]
	);

	const openConversation = useCallback(() => goToRoomPage(roomId), [roomId, goToRoomPage]);

	return (
		<ListItem
			background={isConversationSelected ? 'highlight' : 'none'}
			onClick={openConversation}
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			padding={{ all: '0.422rem' }}
			$selected={isConversationSelected}
			data-testid="list-item"
		>
			<Row>
				{roomType === RoomType.GROUP ? (
					<GroupAvatar roomId={roomId} draftMessage={false} />
				) : (
					<UserAvatar roomId={roomId} draftMessage={false} />
				)}
			</Row>
			<Row
				takeAvailableSpace
				crossAlignment="center"
				width="fill"
				padding={{ left: 'small' }}
				orientation="horizontal"
			>
				<Row takeAvailableSpace crossAlignment="flex-start" orientation="vertical">
					<Text size="small">{roomName}</Text>
					<Container width="fill" height="1rem" orientation="horizontal" mainAlignment="flex-start">
						{iconToDisplay}
						<Text color="secondary" size="extrasmall" overflow="ellipsis" data-testid="message">
							{messageToDisplay}
						</Text>
					</Container>
				</Row>
				{UnreadCounter}
			</Row>
		</ListItem>
	);
};

export default ExpandedSidebarListItem;
