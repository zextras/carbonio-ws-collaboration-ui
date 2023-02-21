/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Icon, Text, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { MarkerStatus } from '../../../types/store/MarkersTypes';

type BubbleFooterProps = {
	isMyMessage: boolean;
	time: string;
	messageRead?: MarkerStatus;
	isEdited?: boolean;
	messageExtension?: string;
	messageSize?: string;
};

const ItalicText = styled(Text)`
	font-style: italic;
	padding-right: ${({ theme }): string => theme.sizes.padding.small};
`;

const BubbleFooter: FC<BubbleFooterProps> = ({
	isMyMessage,
	time,
	messageRead,
	isEdited,
	messageExtension,
	messageSize
}) => {
	const [t] = useTranslation();
	const editedLabel = t('message.edited', 'Edited');
	const ackIcon = messageRead === MarkerStatus.UNREAD ? 'Checkmark' : 'DoneAll';
	const ackIconColor = messageRead === MarkerStatus.READ ? 'primary' : 'gray';

	const dropdownTooltip = useMemo(() => {
		if (ackIcon === 'Checkmark') return t('tooltip.messageSent', 'Sent');
		if (ackIcon === 'DoneAll' && ackIconColor === 'gray')
			return t('tooltip.messageReceived', 'Received');
		return t('tooltip.messageRead', 'Read');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ackIcon, ackIconColor]);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="space-between"
			crossAlignment="flex-end"
			padding={{ top: 'small' }}
		>
			<Container width="fit" padding={{ right: 'medium' }}>
				{messageExtension && messageSize && (
					<Text color="secondary" size="small">
						{messageExtension} {messageSize}
					</Text>
				)}
			</Container>
			<Container orientation="horizontal" width="fit">
				{isEdited && (
					<Container width="fit">
						<ItalicText color="secondary" size="extrasmall">
							{editedLabel}
						</ItalicText>
					</Container>
				)}
				{isMyMessage && messageRead && (
					<Tooltip label={dropdownTooltip}>
						<Container width="fit" padding={{ right: 'small' }}>
							<Icon size="small" icon={ackIcon} color={ackIconColor} />
						</Container>
					</Tooltip>
				)}
				<Container width="fit" crossAlignment="flex-end">
					<Text color="secondary" size="extrasmall">
						{time}
					</Text>
				</Container>
			</Container>
		</Container>
	);
};

export default BubbleFooter;
