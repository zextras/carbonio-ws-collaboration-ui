/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';

import Chat from './Chat';
import useDarkReader from '../../../hooks/useDarkReader';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import { ConversationProps } from '../../../types/store/RoomTypes';
import papyrusDark from '../../assets/papyrus-dark.png';
import papyrus from '../../assets/papyrus.png';
import ConversationInfoPanel from '../infoPanel/ConversationInfoPanel';
import ConversationSearchPanel from '../searchPanel/ConversationSearchPanel';

const ConversationWrapper = styled(Container)<{ $darkModeActive: boolean }>`
	background-image: url('${({ $darkModeActive }): string =>
		$darkModeActive ? papyrusDark : papyrus}');
`;

const LeftPanelContainer = styled(Container)`
	border-left: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
`;

export enum ConversationView {
	CHAT = 'chat',
	INFO = 'info',
	SEARCH = 'search'
}

const Conversation = ({ roomId }: ConversationProps): ReactElement => {
	const isDesktopView = useMediaQueryCheck();
	const { darkReaderStatus } = useDarkReader();

	const [conversationView, setConversationView] = useState<ConversationView>(ConversationView.CHAT);

	useEffect(() => {
		setConversationView((prevState) =>
			prevState === ConversationView.SEARCH ? prevState : ConversationView.CHAT
		);
	}, [isDesktopView]);

	useEffect(() => {
		setConversationView(ConversationView.CHAT);
	}, [roomId]);

	return (
		<ConversationWrapper
			data-testid={`ConversationWrapper-${roomId}`}
			mainAlignment="flex-start"
			orientation="horizontal"
			$darkModeActive={darkReaderStatus}
		>
			{(isDesktopView || conversationView === ConversationView.CHAT) && (
				<Chat
					roomId={roomId}
					conversationView={conversationView}
					setConversationView={setConversationView}
				/>
			)}
			{(isDesktopView || conversationView !== ConversationView.CHAT) && (
				<LeftPanelContainer width={isDesktopView ? '30%' : '100%'} background="gray6">
					{conversationView === ConversationView.SEARCH ? (
						<ConversationSearchPanel
							roomId={roomId}
							goToChatView={() => setConversationView(ConversationView.CHAT)}
						/>
					) : (
						<ConversationInfoPanel
							roomId={roomId}
							goToChatView={() => setConversationView(ConversationView.CHAT)}
						/>
					)}
				</LeftPanelContainer>
			)}
		</ConversationWrapper>
	);
};

export default Conversation;
