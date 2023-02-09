/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { ConfigurationMessage } from '../../../types/store/MessageTypes';
import { configurationMessage } from '../../AffiliationAndConfigurationLabels';
import { CustomMessage } from './MessageFactory';

type ConfigurationMsgProps = {
	message: ConfigurationMessage;
	refEl: React.RefObject<HTMLElement>;
};

const ConfigurationBubble: FC<ConfigurationMsgProps> = ({ message, refEl }) => {
	const [t] = useTranslation();
	const roomName = useStore((store) => getRoomNameSelector(store, message.roomId));
	const sessionId: string | undefined = useStore((state) => state.session.id);
	const actionName = useStore((store) => getUserName(store, message.from));
	const nameToDisplay = useMemo(
		() => (sessionId && message.from === sessionId ? 'You' : actionName),
		[actionName, message.from, sessionId]
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
				{configurationMessage(message.operation, message.value, t, nameToDisplay, roomName)}
			</Text>
		</CustomMessage>
	);
};

export default ConfigurationBubble;
