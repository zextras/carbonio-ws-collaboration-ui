/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import { Container, Icon, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { includes } from 'lodash';
import { useTranslation } from 'react-i18next';

import MessageReactionsList from './MessageReactionsList';
import ReadByPopoverList from './readByPopoverList/ReadByPopoverList';
import { usePinMessage } from '../../../../hooks/usePinMessage';
import { getRoomTypeSelector } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { MarkerStatus, TextMessage } from '../../../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { formatDate } from '../../../../utils/dateUtils';

type BubbleFooterProps = {
	message: TextMessage;
	isMyMessage?: boolean;
	messageExtension?: string;
	messageSize?: string;
	canSeeMessageReads?: boolean | number;
	showReactions?: boolean;
};

const ItalicText = styled(Text)`
	font-style: italic;
	padding-right: ${({ theme }): string => theme.sizes.padding.small};
`;

const CustomIcon = styled(Icon)<{ $clickable: boolean }>`
	cursor: ${({ $clickable }): string => ($clickable ? 'pointer' : 'default')};
`;

const BubbleFooter: FC<BubbleFooterProps> = ({
	message,
	isMyMessage = false,
	messageExtension,
	messageSize,
	canSeeMessageReads,
	showReactions = false
}) => {
	const [t] = useTranslation();
	const { isMessagePinned } = usePinMessage(message);
	const editedLabel = t('message.edited', 'edited');
	const roomType = useStore((store) => getRoomTypeSelector(store, message.roomId ?? ''));

	const { ackIcon, ackIconColor, ackTooltip } = useMemo(() => {
		switch (message.read) {
			case MarkerStatus.READ:
				return {
					ackIcon: 'DoneAll',
					ackIconColor: 'primary',
					ackTooltip: t('tooltip.messageRead', 'Read')
				};
			case MarkerStatus.READ_BY_SOMEONE:
				return {
					ackIcon: 'DoneAll',
					ackIconColor: 'gray',
					ackTooltip: t('tooltip.messageReceived', 'Received')
				};
			case MarkerStatus.UNREAD:
				return {
					ackIcon: 'Checkmark',
					ackIconColor: 'gray',
					ackTooltip: t('tooltip.messageSent', 'Sent')
				};
			case MarkerStatus.PENDING:
			default:
				return {
					ackIcon: 'ClockOutline',
					ackIconColor: 'gray',
					ackTooltip: t('tooltip.pending', 'Pending')
				};
		}
	}, [message.read, t]);

	const messageTime = useMemo(() => formatDate(message.date, 'HH:mm'), [message.date]);

	const ref = useRef(null);

	const readByClickable = useMemo(
		() =>
			includes([MarkerStatus.READ_BY_SOMEONE, MarkerStatus.READ], message.read) &&
			roomType !== RoomType.ONE_TO_ONE,
		[message.read, roomType]
	);

	const messageExtensionSizeLabel = useMemo(
		() => `${messageExtension?.toUpperCase()} • ${messageSize}`,
		[messageExtension, messageSize]
	);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="space-between"
			crossAlignment="flex-end"
			padding={{ top: 'small' }}
		>
			<Row
				takeAvailableSpace
				mainAlignment="flex-start"
				padding={{ right: 'medium' }}
				wrap="nowrap"
			>
				<Container orientation="horizontal" mainAlignment="flex-start" gap="0.5rem">
					{messageExtension && messageSize && (
						<Tooltip label={messageExtensionSizeLabel} overflowTooltip>
							<Text color="secondary" size="small" overflow="ellipsis">
								{messageExtensionSizeLabel}
							</Text>
						</Tooltip>
					)}
					{showReactions && (
						<MessageReactionsList roomId={message.roomId} stanzaId={message.stanzaId} />
					)}
				</Container>
			</Row>
			<Row orientation="horizontal" width="fit" gap="0.25rem">
				{message.edited && (
					<Container width="fit">
						<ItalicText color="secondary" size="extrasmall">
							{editedLabel}
						</ItalicText>
					</Container>
				)}
				{isMessagePinned && (
					<Tooltip label={t('tooltip.pinnedMessage', 'Pinned message')}>
						<Container width="fit">
							<Icon color="secondary" icon={'Pin3'} size="small" />
						</Container>
					</Tooltip>
				)}
				{isMyMessage &&
					message.read &&
					(canSeeMessageReads || message.read === MarkerStatus.PENDING) && (
						<Container
							id="container-read-by-icon"
							width="fit"
							style={{ position: 'relative' }}
							ref={ref}
						>
							<Tooltip label={ackTooltip}>
								<CustomIcon
									$clickable={readByClickable}
									size="small"
									icon={ackIcon}
									color={ackIconColor}
								/>
							</Tooltip>
							{message.roomId && message.stanzaId && readByClickable && (
								<ReadByPopoverList
									roomId={message.roomId}
									stanzaId={message.stanzaId}
									anchorRef={ref}
								/>
							)}
						</Container>
					)}
				<Text color="secondary" size="small">
					{messageTime}
				</Text>
			</Row>
		</Container>
	);
};

export default BubbleFooter;
