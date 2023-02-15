/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';

import { useAffiliationMessage } from '../../../hooks/useAffiliationMessage';
import { AffiliationMessage } from '../../../types/store/MessageTypes';
import { CustomMessage } from './MessageFactory';

type AffiliationMsgProps = {
	message: AffiliationMessage;
	refEl: React.RefObject<HTMLElement>;
};

const AffiliationBubble: FC<AffiliationMsgProps> = ({ message, refEl }) => {
	const affiliationLabel = useAffiliationMessage(message.as, message.roomId, message.userId);

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
				{affiliationLabel}
			</Text>
		</CustomMessage>
	);
};

export default AffiliationBubble;
