/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
// import { useTranslation } from 'react-i18next';

import { getUsersSelector } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { AffiliationMessage } from '../../../types/store/MessageTypes';
import { CustomMessage } from './MessageFactory';

type AffiliationMsgProps = {
	message: AffiliationMessage;
	refEl: React.RefObject<HTMLElement>;
};

const AffiliationBubble: FC<AffiliationMsgProps> = ({ message, refEl }) => {
	const users = useStore(getUsersSelector);
	const displayName = useMemo(
		() => users[message.userId]?.name || users[message.userId]?.email || message.userId,
		[message.userId, users]
	);

	return (
		<CustomMessage
			id={`message-${message.id}`}
			ref={refEl}
			mainAlignment={'flex-start'}
			crossAlignment={'flex-start'}
			borderColor="gray3"
			key={message.id}
			serviceMessage
			data-testid={`affiliation_msg-${message.id}`}
		>
			<Text size={'medium'} color={'gray1'}>
				{displayName} affiliate as {message.as}
			</Text>
		</CustomMessage>
	);
};

export default AffiliationBubble;
