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
import { ConversationProps } from '../../../types/store/RoomTypes';
import papyrusDark from '../../assets/papyrus-dark.png';
import papyrus from '../../assets/papyrus.png';
import ConversationInfoPanel from '../infoPanel/ConversationInfoPanel';
import ConversationSearchPanel from '../searchPanel/ConversationSearchPanel';

const ConversationWrapper = styled(Container)<{ $darkModeActive: boolean }>`
	background-image: url('${({ $darkModeActive }): string =>
		$darkModeActive ? papyrusDark : papyrus}');
`;

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
				/>
			)}
			{(isDesktopView || infoPanelOpen || searchPanelOpen) && (
				<Container width={infoPanelOpen || searchPanelOpen ? '100%' : '30%'} background="gray6">
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
