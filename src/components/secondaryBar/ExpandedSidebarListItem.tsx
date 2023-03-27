/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Badge,
	Container,
	Icon,
	Row,
	Shimmer,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { find, map } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRouting from '../../hooks/useRouting';
import {
	getDraftMessage,
	getRoomIsWritingList
} from '../../store/selectors/ActiveConversationsSelectors';
import { getLastMessageSelector } from '../../store/selectors/MessagesSelectors';
import {
	getRoomMembers,
	getRoomMutedSelector,
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../store/selectors/RoomsSelectors';
import { getSelectedConversation } from '../../store/selectors/SessionSelectors';
import { getRoomUnreadsSelector } from '../../store/selectors/UnreadsCounterSelectors';
import { getUserName } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import { Message, MessageType } from '../../types/store/MessageTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { affiliationMessage } from '../../utils/affiliationMessage';
import { configurationMessage } from '../../utils/configurationMessage';
import GroupAvatar from '../GroupAvatar';
import UserAvatar from '../UserAvatar';

type ExpandedSidebarListItemProps = {
	roomId: string;
};

const ListItem = styled(Container)`
	cursor: pointer;
	&:hover {
		background-color: ${({ selected, theme }): string =>
			selected ? theme.palette.highlight.regular : theme.palette.gray3.regular};
	}
	-webkit-user-select: none;
	user-select: none;
`;

const ExpandedSidebarListItem: React.FC<ExpandedSidebarListItemProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const isTypingLabel = t('status.isTyping', 'is typing...');
	const areTypingLabel = t('status.areTyping', 'are typing...');
	const draftLabel = t('message.draft', 'draft');
	const deletedMessageLabel = t('message.deletedMessage', 'Deleted message');

	const { goToRoomPage } = useRouting();

	const sessionId: string | undefined = useStore((store) => store.session.id);
	const lastMessageOfRoom: Message | null = useStore((state) =>
		getLastMessageSelector(state, roomId)
	);
	const unreadMessagesCount = useStore((store) => getRoomUnreadsSelector(store, roomId));
	const roomType = useStore((state) => getRoomTypeSelector(state, roomId));
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const usersWritingList = useStore((state) => getRoomIsWritingList(state, roomId));
	const isConversationSelected = useStore((state) => getSelectedConversation(state, roomId));
	const userNameOfLastMessageOfRoom = useStore((store) =>
		lastMessageOfRoom && lastMessageOfRoom.type === MessageType.TEXT_MSG
			? getUserName(store, lastMessageOfRoom.from)
			: lastMessageOfRoom && lastMessageOfRoom.type === MessageType.AFFILIATION_MSG
			? getUserName(store, lastMessageOfRoom.userId)
			: lastMessageOfRoom && lastMessageOfRoom.type === MessageType.CONFIGURATION_MSG
			? getUserName(store, lastMessageOfRoom.from)
			: ''
	);
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));
	const actionName = useStore((store) =>
		getUserName(
			store,
			lastMessageOfRoom?.type === MessageType.CONFIGURATION_MSG ? lastMessageOfRoom.from : ''
		)
	);
	const roomMembers = useStore((store) => getRoomMembers(store, roomId));
	const affiliatedName = useStore((store) =>
		getUserName(
			store,
			lastMessageOfRoom?.type === MessageType.AFFILIATION_MSG ? lastMessageOfRoom.userId : ''
		)
	);

	// id of the users who acts, in this case the one who creates the one-to-one conversation
	const actionMemberId = useMemo(() => {
		if (
			roomType === RoomType.ONE_TO_ONE &&
			lastMessageOfRoom?.type === MessageType.AFFILIATION_MSG
		) {
			return find(roomMembers, (member) => member.userId !== lastMessageOfRoom.userId)?.userId;
		}
		return '';
	}, [roomType, lastMessageOfRoom, roomMembers]);

	const nameToDisplay = useMemo(
		() =>
			sessionId &&
			lastMessageOfRoom?.type === MessageType.CONFIGURATION_MSG &&
			lastMessageOfRoom.from === sessionId
				? 'You'
				: actionName,
		[actionName, lastMessageOfRoom, sessionId]
	);

	const ackHasToAppear = useMemo(
		() =>
			lastMessageOfRoom &&
			lastMessageOfRoom.type === MessageType.TEXT_MSG &&
			lastMessageOfRoom.from === sessionId &&
			!usersWritingList,
		[lastMessageOfRoom, sessionId, usersWritingList]
	);

	const ackIcon = useMemo(() => {
		if (lastMessageOfRoom && lastMessageOfRoom.type === MessageType.TEXT_MSG) {
			switch (lastMessageOfRoom.read) {
				case MarkerStatus.UNREAD:
					return <Icon size="small" icon="Checkmark" color="gray" />;
				case MarkerStatus.READ:
					return <Icon size="small" icon="DoneAll" color="primary" />;
				default:
					return <Icon size="small" icon="DoneAll" color="gray" />;
			}
		}
		return undefined;
	}, [lastMessageOfRoom]);

	const dropdownTooltip = useMemo(() => {
		if (lastMessageOfRoom && lastMessageOfRoom.type === MessageType.TEXT_MSG) {
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

	const messageToDisplay = useMemo((): JSX.Element | string | undefined => {
		if ((usersWritingList && usersWritingList.length === 0) || !usersWritingList) {
			if (lastMessageOfRoom) {
				switch (lastMessageOfRoom.type) {
					case MessageType.TEXT_MSG: {
						const text = (): string => {
							if (lastMessageOfRoom.attachment) {
								return lastMessageOfRoom.text !== ''
									? lastMessageOfRoom.text
									: lastMessageOfRoom.attachment.name;
							}
							return lastMessageOfRoom.forwarded
								? lastMessageOfRoom.forwarded.text
								: lastMessageOfRoom.text;
						};
						if (
							roomType === RoomType.GROUP &&
							lastMessageOfRoom.from !== sessionId &&
							userNameOfLastMessageOfRoom
						) {
							return `${userNameOfLastMessageOfRoom.split(/(\s+)/)[0]}: ${text()}`;
						}
						return text();
					}
					case MessageType.AFFILIATION_MSG:
						return affiliationMessage(
							lastMessageOfRoom?.type === MessageType.AFFILIATION_MSG ? lastMessageOfRoom.as : '',
							roomId,
							lastMessageOfRoom?.type === MessageType.AFFILIATION_MSG
								? lastMessageOfRoom.userId
								: '',
							actionMemberId,
							actionName || '',
							sessionId,
							roomType,
							roomName,
							affiliatedName || '',
							t
						);
					case MessageType.CONFIGURATION_MSG:
						return configurationMessage(
							lastMessageOfRoom?.type === MessageType.CONFIGURATION_MSG
								? lastMessageOfRoom.operation
								: '',
							lastMessageOfRoom?.type === MessageType.CONFIGURATION_MSG
								? lastMessageOfRoom.value
								: '',
							lastMessageOfRoom?.type === MessageType.CONFIGURATION_MSG
								? lastMessageOfRoom.from
								: '',
							roomId,
							roomName,
							nameToDisplay || '',
							t
						);
					case MessageType.DELETED_MSG:
						return deletedMessageLabel;
					default:
						return `affiliation message to replace`;
				}
			}
		}
		if (usersWritingList && usersWritingList.length === 1) {
			return `${usersWritingList[0].split(/(\s+)/)[0]} ${isTypingLabel}`;
		}
		if (usersWritingList && usersWritingList.length > 1) {
			const usersWritingListNames: string[] = [];
			map(usersWritingList, (user) => {
				usersWritingListNames.push(user.split(/(\s+)/)[0]);
			});
			return `${usersWritingListNames.join(', ')} ${areTypingLabel}`;
		}
		return undefined;
	}, [
		usersWritingList,
		lastMessageOfRoom,
		roomType,
		sessionId,
		userNameOfLastMessageOfRoom,
		roomId,
		actionMemberId,
		actionName,
		roomName,
		affiliatedName,
		t,
		nameToDisplay,
		deletedMessageLabel,
		isTypingLabel,
		areTypingLabel
	]);

	const UnreadCounter = useMemo(
		() =>
			unreadMessagesCount > 0 ? (
				<Row padding={{ left: 'small' }} mainAlignment="center" crossAlignment="center">
					<Badge value={unreadMessagesCount} type={!roomMuted ? 'unread' : 'read'} />
				</Row>
			) : null,
		[unreadMessagesCount, roomMuted]
	);

	const openConversation = useCallback(() => goToRoomPage(roomId), [roomId, goToRoomPage]);

	return (
		<ListItem
			background={isConversationSelected ? 'highlight' : 'none'}
			onClick={openConversation}
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			padding={{ all: 'small' }}
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
				crossAlignment="flex-start"
				width="fill"
				padding={{ left: 'small' }}
				orientation="horizontal"
			>
				{roomName !== '' ? (
					<>
						<Row takeAvailableSpace crossAlignment="flex-start" orientation="vertical">
							<Text size="small">{roomName}</Text>
							<Container
								width="fill"
								height="fit"
								orientation="horizontal"
								mainAlignment="flex-start"
							>
								{draftMessage && (
									<Tooltip label={draftTooltip} maxWidth="12.5rem">
										<Container width="fit" padding={{ right: 'extrasmall' }}>
											<Icon size="small" icon="Edit2" color="gray" />
										</Container>
									</Tooltip>
								)}
								{!draftMessage && ackHasToAppear && (
									<Tooltip label={dropdownTooltip}>
										<Container width="fit" padding={{ right: 'extrasmall' }}>
											{ackIcon}
										</Container>
									</Tooltip>
								)}
								{lastMessageOfRoom?.type === MessageType.TEXT_MSG &&
									lastMessageOfRoom.attachment && (
										<Container width="fit" padding={{ right: 'extrasmall' }}>
											<Icon size="small" icon="FileTextOutline" color="gray" />
										</Container>
									)}
								<Text color="secondary" size="extrasmall" overflow="ellipsis" data-testid="message">
									{messageToDisplay}
								</Text>
							</Container>
						</Row>
						{UnreadCounter}
					</>
				) : (
					<Shimmer.Text width="100%" />
				)}
			</Row>
		</ListItem>
	);
};

export default ExpandedSidebarListItem;
