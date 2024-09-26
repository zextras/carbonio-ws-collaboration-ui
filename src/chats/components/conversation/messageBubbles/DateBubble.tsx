/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Z_INDEX_RANK } from '../../../../types/generics';
import { DateMessage } from '../../../../types/store/MessageTypes';
import { dateString } from '../../../../utils/dateUtils';

type DateMsgProps = {
	message: DateMessage;
	refEl: React.RefObject<HTMLDivElement>;
	messageListRef?: React.RefObject<HTMLDivElement | undefined>;
};

const CustomMessageWrapper = styled(Container)`
	position: sticky;
	top: 0;
	margin: auto;
	width: fit-content;
	z-index: ${Z_INDEX_RANK.DATE_STICKY_LABEL};
`;

const DateContainer = styled(Container)<{ $messageListWidth: number | undefined }>`
	width: fit-content;
	max-width: calc(
		${({ $messageListWidth }): string =>
			$messageListWidth ? `${$messageListWidth}px - 2rem` : '100%'}
	);
	white-space: pre-wrap;
	word-break: break-word;
	height: auto;
	padding: 0.25em 1em;
	margin: 0.625rem auto;
	cursor: default;
	user-select: none;
	-webkit-user-select: none;
	text-align: center;

	border-radius: 1rem;
	box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);
`;

const DateBubble: FC<DateMsgProps> = ({ message, refEl, messageListRef }) => {
	const [t] = useTranslation();

	const dateLabel = useMemo(() => {
		const date = dateString(message.date);
		if (date === 'Today') return t('date.today', 'Today');
		if (date === 'Yesterday') return t('date.yesterday', 'Yesterday');
		return date;
	}, [message, t]);

	return (
		<CustomMessageWrapper>
			<DateContainer
				ref={refEl}
				id={`message-${message.id}`}
				mainAlignment={'flex-start'}
				crossAlignment={'flex-start'}
				key={message.id}
				data-testid={`date_msg-${message.id}`}
				background={'gray6'}
				$messageListWidth={messageListRef?.current?.clientWidth}
			>
				<Text color={'gray1'}>{dateLabel}</Text>
			</DateContainer>
		</CustomMessageWrapper>
	);
};

export default DateBubble;
