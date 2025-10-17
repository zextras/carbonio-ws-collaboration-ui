/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import styled from '@emotion/styled';
import { Container, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import HighlightedText from './HighlightedText';
import useAvatarUtilities from '../../../hooks/useAvatarUtilities';
import {
	getIsMessageSelected,
	getIsMessageSelectedAlreadyStored
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getIsLoggedUser } from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { formatDate } from '../../../utils/dateUtils';
import { scrollToMessage } from '../../../utils/scrollUtils';

const CustomContainer = styled(Container)`
	border-radius: 0.25rem;
	border: 1px solid ${({ theme }): string => theme.palette.gray3.regular};
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
	cursor: pointer;
	&:hover {
		background: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

interface SearchResultMessageProps {
	message: TextMessage;
	searchText: string;
}

const SearchResultMessage = ({
	message,
	searchText
}: SearchResultMessageProps): React.ReactElement => {
	const senderIsLoggedUser = useStore((store) => getIsLoggedUser(store, message.from));
	const senderName = useStore((store) => getUserName(store, message.from));
	const isMessageSelected = useStore((state) =>
		getIsMessageSelected(state, message.roomId, message.stanzaId)
	);
	const isMessageSelectedAlreadyStored = useStore((state) =>
		getIsMessageSelectedAlreadyStored(state, message.roomId, message.stanzaId)
	);

	const [t] = useTranslation();
	const youLabel = t('status.you', 'You');

	const { avatarColor } = useAvatarUtilities(message.from);

	const onResultClick = useCallback(() => {
		useStore.getState().setSelectedSearchResult(message.roomId, message.stanzaId);
		if (!isMessageSelectedAlreadyStored && !isMessageSelected) {
			const { xmppClient } = useStore.getState().connections;
			xmppClient.requestMessageResultHistoryToId(message.roomId, message.stanzaId).then(() => {
				scrollToMessage(message.id);
				useStore.getState().setScrollPosition(message.roomId, message.id);
			});
		} else {
			scrollToMessage(message.id);
		}
	}, [isMessageSelected, isMessageSelectedAlreadyStored, message]);

	return (
		<CustomContainer
			height="fit"
			crossAlignment="flex-start"
			padding="small"
			gap="0.5rem"
			onClick={onResultClick}
			background={isMessageSelected ? 'highlight' : 'transparent'}
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
				<HighlightedText text={message.text} searchText={searchText} />
			</Row>
		</CustomContainer>
	);
};
export default SearchResultMessage;
