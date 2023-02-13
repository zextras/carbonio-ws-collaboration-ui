/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';

import { useConfigurationMessage } from '../../../hooks/AffiliationAndConfigurationLabels';
import { ConfigurationMessage } from '../../../types/store/MessageTypes';
import { CustomMessage } from './MessageFactory';

type ConfigurationMsgProps = {
	message: ConfigurationMessage;
	refEl: React.RefObject<HTMLElement>;
};

const ConfigurationBubble: FC<ConfigurationMsgProps> = ({ message, refEl }) => {
	const configurationLabel = useConfigurationMessage(
		message.operation,
		message.value,
		message.from,
		message.roomId
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
			data-testid={`configuration_msg-${message.id}`}
		>
			<Text size={'medium'} color={'gray1'} overflow="break-word">
				{configurationLabel}
			</Text>
		</CustomMessage>
	);
};

export default ConfigurationBubble;
