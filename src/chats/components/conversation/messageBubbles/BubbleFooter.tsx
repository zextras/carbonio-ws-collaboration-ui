/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import {
	Container,
	Icon,
	Padding,
	Row,
	Text,
	TextWithTooltip,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { MarkerStatus } from '../../../../types/store/MarkersTypes';
import { formatDate } from '../../../../utils/dateUtils';

type BubbleFooterProps = {
	date: number;
	isMyMessage?: boolean;
	messageRead?: MarkerStatus;
	messageType?: string;
	messageExtension?: string;
	messageSize?: string;
	isEdited?: boolean;
	canSeeMessageReads?: boolean | number;
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
	canSeeMessageReads
}) => {
	const [t] = useTranslation();
	const editedLabel = t('message.edited', 'edited');

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

	return (
		<Container
			orientation="horizontal"
			mainAlignment="space-between"
			crossAlignment="flex-end"
			padding={{ top: 'small' }}
		>
			<Row takeAvailableSpace mainAlignment="flex-start" padding={{ right: 'medium' }}>
				{messageExtension && messageSize && (
					<TextWithTooltip color="secondary" size="small">
						{messageExtension} • {messageSize}
					</TextWithTooltip>
				)}
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
						<Tooltip label={dropdownTooltip}>
							<Padding width="fit" right="small">
								<Icon size="small" icon={ackIcon} color={ackIconColor} />
							</Padding>
						</Tooltip>
					)}
				<Text color="secondary" size="small">
					{messageTime}
				</Text>
			</Row>
		</Container>
	);
};

export default BubbleFooter;
