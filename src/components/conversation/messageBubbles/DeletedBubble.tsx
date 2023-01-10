/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text, Padding } from '@zextras/carbonio-design-system';
import moment from 'moment-timezone';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getPrefTimezoneSelector } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { Message } from '../../../types/store/MessageTypes';

type DeletedBubbleProps = {
	message: Message;
	isMyMessage: boolean;
};

const BubbleDeletedContainer = styled(Container)`
	margin-top: 0.25rem;
	margin-bottom: 0.25rem;
	${({ isMyMessage }): string => isMyMessage && 'margin-left: auto;'};
	box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);
	border-radius: ${({ isMyMessage }): string =>
		isMyMessage ? '0.25rem 0.25rem 0 0.25rem' : '0.25rem 0.25rem 0.25rem 0'};
`;

const CustomText = styled(Text)`
	font-style: italic;
	padding-right: 0.1875rem;
`;

const DeletedBubble: FC<DeletedBubbleProps> = ({ message, isMyMessage }) => {
	const [t] = useTranslation();
	const deletedMessageLabel = t('message.deletedMessage', 'Deleted message');
	const timezone = useStore(getPrefTimezoneSelector);
	const messageTime = moment.tz(message.date, timezone).format('HH:MM');

	return (
		<BubbleDeletedContainer
			key={`${message.id}-deleted`}
			height="fit"
			width="fit"
			orientation="horizontal"
			padding={{ all: 'medium' }}
			background={'gray3'}
			isMyMessage={isMyMessage}
		>
			<CustomText color="secondary" size="small">
				{deletedMessageLabel}
			</CustomText>
			<Padding left="small" />
			<Text color="secondary" size="small">
				{messageTime}
			</Text>
		</BubbleDeletedContainer>
	);
};

export default DeletedBubble;