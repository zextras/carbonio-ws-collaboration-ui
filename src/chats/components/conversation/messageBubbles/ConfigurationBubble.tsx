/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Text } from '@zextras/carbonio-design-system';

import { CustomMessage } from './MessageFactory';
import { ConfigurationMessage } from '../../../../types/store/MessageTypes';
import { ConfigurationMessageLabel } from '../../../../utils/ConfigurationMessageLabel';

type ConfigurationMsgProps = {
	message: ConfigurationMessage;
	refEl: React.RefObject<HTMLDivElement>;
};

const ConfigurationBubble: FC<ConfigurationMsgProps> = ({ message, refEl }) => (
	<CustomMessage
		id={`message-${message.id}`}
		ref={refEl}
		mainAlignment={'flex-start'}
		crossAlignment={'flex-start'}
		borderColor="gray3"
		key={message.id}
		data-testid={`configuration_msg-${message.id}`}
	>
		<Text color={'gray1'} overflow="break-word">
			<ConfigurationMessageLabel message={message} />
		</Text>
	</CustomMessage>
);

export default ConfigurationBubble;
