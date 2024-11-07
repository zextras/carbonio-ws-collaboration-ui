/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	TextWithTooltip,
	Tooltip
} from '@zextras/carbonio-design-system';
import { includes } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MessageReactionsList from './MessageReactionsList';
import ReadByDropdown from './readByDropdown/ReadByDropdown';
import { MarkerStatus } from '../../../../types/store/MarkersTypes';
import { formatDate } from '../../../../utils/dateUtils';

type BubbleFooterProps = {
	date: number;
	isMyMessage?: boolean;
	messageRead?: MarkerStatus;
	messageExtension?: string;
	messageSize?: string;
	isEdited?: boolean;
	canSeeMessageReads?: boolean | number;
	showReactions?: boolean;
	roomId?: string;
	stanzaId?: string;
};

const ItalicText = styled(Text)`
	font-style: italic;
	padding-right: ${({ theme }): string => theme.sizes.padding.small};
`;

const BubbleFooter: FC<BubbleFooterProps> = ({
	date,
	isMyMessage = false,
	messageRead,
	messageExtension,
	messageSize,
	isEdited,
	canSeeMessageReads,
	roomId,
	stanzaId,
	showReactions = false
}) => {
	const [t] = useTranslation();
	const editedLabel = t('message.edited', 'edited');

	const [readByDropdownOpen, setReadByDropdownOpen] = useState(false);

	const { ackIcon, ackIconColor } = useMemo(() => {
		switch (messageRead) {
			case MarkerStatus.READ:
				return { ackIcon: 'DoneAll', ackIconColor: 'primary' };
			case MarkerStatus.READ_BY_SOMEONE:
				return { ackIcon: 'DoneAll', ackIconColor: 'gray' };
			case MarkerStatus.UNREAD:
				return { ackIcon: 'Checkmark', ackIconColor: 'gray' };
			case MarkerStatus.PENDING:
				return { ackIcon: 'ClockOutline', ackIconColor: 'gray' };
			default:
				return { ackIcon: 'ClockOutline', ackIconColor: 'gray' };
		}
	}, [messageRead]);

	const messageTime = useMemo(() => formatDate(date, 'HH:mm'), [date]);

	const dropdownTooltip = useMemo(() => {
		switch (messageRead) {
			case MarkerStatus.READ:
				return t('tooltip.messageRead', 'Read');
			case MarkerStatus.READ_BY_SOMEONE:
				return t('tooltip.messageReceived', 'Received');
			case MarkerStatus.UNREAD:
				return t('tooltip.messageSent', 'Sent');
			case MarkerStatus.PENDING:
				return t('tooltip.pending', 'Pending');
			default:
				return t('tooltip.pending', 'Pending');
		}
	}, [messageRead, t]);

	const closeDropdown = useCallback(() => setReadByDropdownOpen(false), []);
	const handleScroll = useCallback(
		(e: Event) => {
			const dropdownReadBy = window.document.getElementById(`read-by-dropdown-${stanzaId}`);
			if (dropdownReadBy && !dropdownReadBy.contains(e.target as Node)) {
				setReadByDropdownOpen(false);
			}
		},
		[stanzaId]
	);

	useEffect(() => {
		document.addEventListener('click', closeDropdown, true);
		const messageListRef = window.document.getElementById(`messageListRef${roomId}`);
		messageListRef?.addEventListener('scroll', handleScroll, true);
		return (): void => {
			document.removeEventListener('click', closeDropdown, true);
			messageListRef?.removeEventListener('scroll', handleScroll, true);
		};
	}, [closeDropdown, handleScroll, roomId]);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="space-between"
			crossAlignment="flex-end"
			padding={{ top: 'small' }}
		>
			<Row takeAvailableSpace mainAlignment="flex-start" padding={{ right: 'medium' }}>
				<Container orientation="horizontal" width="fit" gap="0.5rem">
					{messageExtension && messageSize && (
						<TextWithTooltip color="secondary" size="small">
							{messageExtension} • {messageSize}
						</TextWithTooltip>
					)}
					{showReactions && <MessageReactionsList roomId={roomId!} stanzaId={stanzaId!} />}
				</Container>
			</Row>
			<Row orientation="horizontal" width="fit">
				{isEdited && (
					<Container width="fit">
						<ItalicText color="secondary" size="extrasmall">
							{editedLabel}
						</ItalicText>
					</Container>
				)}
				{isMyMessage &&
					messageRead &&
					(canSeeMessageReads || messageRead === MarkerStatus.PENDING) && (
						<Container width="fit" style={{ position: 'relative' }}>
							<Tooltip label={dropdownTooltip}>
								{includes([MarkerStatus.PENDING, MarkerStatus.UNREAD], messageRead) ? (
									<Padding width="fit" all="extrasmall">
										<Icon size="small" icon={ackIcon} color={ackIconColor} />
									</Padding>
								) : (
									<Button
										icon={ackIcon}
										color={ackIconColor}
										onClick={(): void => setReadByDropdownOpen((prev) => !prev)}
										size="small"
										type="ghost"
									/>
								)}
							</Tooltip>
							{readByDropdownOpen && roomId && stanzaId && (
								<ReadByDropdown roomId={roomId} stanzaId={stanzaId} />
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
