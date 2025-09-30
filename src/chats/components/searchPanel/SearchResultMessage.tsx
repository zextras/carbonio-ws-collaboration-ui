/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import styled from '@emotion/styled';
import { Container, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useAvatarUtilities from '../../../hooks/useAvatarUtilities';
import { getIsLoggedUser } from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { formatDate } from '../../../utils/dateUtils';

const CustomContainer = styled(Container)`
	border-radius: 0.25rem;
	border: 1px solid ${({ theme }): string => theme.palette.gray3.regular};
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
	cursor: pointer;
	&:hover {
		background: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

const SearchResultMessage = ({ message }: { message: TextMessage }): React.ReactElement => {
	const senderIsLoggedUser = useStore((store) => getIsLoggedUser(store, message.from));
	const senderName = useStore((store) => getUserName(store, message.from));

	const [t] = useTranslation();
	const youLabel = t('status.you', 'You');

	const { avatarColor } = useAvatarUtilities(message.from);

	const onResultClick = useCallback(() => {
		const { xmppClient } = useStore.getState().connections;
		// TODO avoid to make a request id data already available in the store
		xmppClient.requestMessageResultHistoryFromId(message.roomId, message.stanzaId, true);
		xmppClient.requestMessageResultHistoryToId(message.roomId, message.stanzaId);
		// TODO scroll into view
	}, [message.roomId, message.stanzaId]);

	return (
		<CustomContainer
			height="fit"
			crossAlignment="flex-start"
			padding="small"
			gap="0.5rem"
			onClick={onResultClick}
		>
			<Row width="fill">
				<Row takeAvailableSpace mainAlignment="flex-start">
					<Text color={avatarColor} weight="bold">
						{senderIsLoggedUser ? youLabel : senderName}
					</Text>
				</Row>
				<Text color="secondary" size="small">
					{formatDate(message.date, 'DD/MM/YYYY - HH:mm')}
				</Text>
			</Row>
			<Row takeAvailableSpace>
				<Text overflow="ellipsis">{message.text}</Text>
			</Row>
		</CustomContainer>
	);
};
export default SearchResultMessage;
