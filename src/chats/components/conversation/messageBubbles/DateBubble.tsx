/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CustomMessage } from './MessageFactory';
import { Z_INDEX_RANK } from '../../../../types/generics';
import { DateMessage } from '../../../../types/store/MessageTypes';
import { dateString } from '../../../../utils/dateUtils';

type DateMsgProps = {
	message: DateMessage;
	refEl: React.RefObject<HTMLDivElement>;
};

const CustomMessageWrapper = styled(Container)`
	position: sticky;
	top: 0;
	z-index: ${Z_INDEX_RANK.DATE_STICKY_LABEL};
`;

const DateBubble: FC<DateMsgProps> = ({ message, refEl }) => {
	const [t] = useTranslation();

	const dateLabel = useMemo(() => {
		const date = dateString(message.date);
		if (date === 'Today') return t('date.today', 'Today');
		if (date === 'Yesterday') return t('date.yesterday', 'Yesterday');
		return date;
	}, [message, t]);

	return (
		<CustomMessageWrapper>
			<CustomMessage
				ref={refEl}
				id={`message-${message.id}`}
				mainAlignment={'flex-start'}
				crossAlignment={'flex-start'}
				key={message.id}
				$dateMessage
				data-testid={`date_msg-${message.id}`}
			>
				<Text color={'gray1'}>{dateLabel}</Text>
			</CustomMessage>
		</CustomMessageWrapper>
	);
};

export default DateBubble;
