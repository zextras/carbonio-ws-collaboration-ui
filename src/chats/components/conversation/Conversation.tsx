/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';

import Chat from './Chat';
import useDarkReader from '../../../hooks/useDarkReader';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import { FALLBACK_MESSAGE_SELECTOR } from '../../../store/selectors/ChatsRegistrySelectors';
import useStore from '../../../store/Store';
import { Message } from '../../../types/store/ChatsRegistryTypes';
import { ConversationProps } from '../../../types/store/RoomTypes';
import papyrusDark from '../../assets/papyrus-dark.png';
import papyrus from '../../assets/papyrus.png';
import ConversationInfoPanel from '../infoPanel/ConversationInfoPanel';
import ConversationSearchPanel from '../searchPanel/ConversationSearchPanel';

const ConversationWrapper = styled(Container)<{ $darkModeActive: boolean }>`
	background-image: url('${({ $darkModeActive }): string =>
		$darkModeActive ? papyrusDark : papyrus}');
`;

function useMessages(roomId: string): Message[] {
	return useStore(({ chatsRegistry, activeConversations }) => {
		console.log(chatsRegistry);
		console.log(activeConversations);
		const selectedSearchResult = activeConversations[roomId]?.selectedSearchResult;
		if (selectedSearchResult === undefined) {
			return chatsRegistry[roomId]?.messages || FALLBACK_MESSAGE_SELECTOR;
		}

		return (
			chatsRegistry[roomId].searchResultHistory[selectedSearchResult] || FALLBACK_MESSAGE_SELECTOR
		);
	});
}

const Conversation = ({ roomId }: ConversationProps): ReactElement => {
	const isDesktopView = useMediaQueryCheck();
	const { darkReaderStatus } = useDarkReader();

	const [infoPanelOpen, setInfoPanelOpen] = useState(false);
	const [searchPanelOpen, setSearchPanelOpen] = useState(false);

	const toggleInfoPanel = useCallback(() => {
		setInfoPanelOpen((prevState) => !prevState);
	}, []);

	const toggleSearchPanel = useCallback(() => {
		setSearchPanelOpen((prevState) => !prevState);
	}, []);

	useEffect(() => {
		if (isDesktopView) {
			setInfoPanelOpen(false);
		}
	}, [isDesktopView]);

	const messages = useMessages(roomId);

	return (
		<ConversationWrapper
			data-testid={`ConversationWrapper-${roomId}`}
			mainAlignment="flex-start"
			orientation="horizontal"
			$darkModeActive={darkReaderStatus}
		>
			{(isDesktopView || (!infoPanelOpen && !searchPanelOpen)) && (
				<Chat
					roomId={roomId}
					setInfoPanelOpen={setInfoPanelOpen}
					toggleSearchPanel={toggleSearchPanel}
					messages={messages}
				/>
			)}
			{(isDesktopView || infoPanelOpen || searchPanelOpen) && (
				<Container width={isDesktopView ? '30%' : '100%'} background="gray6">
					{searchPanelOpen ? (
						<ConversationSearchPanel roomId={roomId} toggleSearchPanel={toggleSearchPanel} />
					) : (
						<ConversationInfoPanel roomId={roomId} toggleInfoPanel={toggleInfoPanel} />
					)}
				</Container>
			)}
		</ConversationWrapper>
	);
};

export default Conversation;
