/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getPrefTimezoneSelector } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { DateMessage } from '../../../types/store/MessageTypes';
import { dateString } from '../../../utils/dateUtil';
import { CustomMessage } from './MessageFactory';

type DateMsgProps = {
	message: DateMessage;
	refEl: React.RefObject<HTMLElement>;
};

const DateBubble: FC<DateMsgProps> = ({ message, refEl }) => {
	const [t] = useTranslation();
	const timezone = useStore(getPrefTimezoneSelector);
	const dateLabel = useMemo(() => {
		const date = dateString(message.date, timezone);
		if (date === 'Today') return t('date.today', 'Today');
		if (date === 'Yesterday') return t('date.yesterday', 'Yesterday');
		return date;
	}, [message, t, timezone]);
	return (
		<CustomMessage
			ref={refEl}
			id={`message-${message.id}`}
			mainAlignment={'flex-start'}
			crossAlignment={'flex-start'}
			key={message.id}
			dateMessage
			data-testid={`data_msg-${message.id}`}
		>
			<Text color={'gray1'}>{dateLabel}</Text>
		</CustomMessage>
	);
};

export default DateBubble;
