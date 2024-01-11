/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import Chat from './Chat';
import { useDarkReaderStatus } from '../../../hooks/useDarkReaderStatus';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import { ConversationProps } from '../../../types/store/RoomTypes';
import papyrusDark from '../../assets/papyrus-dark.png';
import papyrus from '../../assets/papyrus.png';
import ConversationInfoPanel from '../infoPanel/ConversationInfoPanel';

const ConversationWrapper = styled(Container)<{ $darkModeActive: boolean }>`
	background-image: url('${({ $darkModeActive }): string =>
		$darkModeActive ? papyrusDark : papyrus}');
`;

const Conversation = ({ roomId }: ConversationProps): ReactElement => {
	const isDesktopView = useMediaQueryCheck();
	const isDarkModeEnabled = useDarkReaderStatus();

	const [infoPanelOpen, setInfoPanelOpen] = useState(false);

	useEffect(() => {
		if (isDesktopView) {
			setInfoPanelOpen(false);
		}
	}, [isDesktopView]);

	return (
		<ConversationWrapper
			data-testid="ConversationWrapper"
			mainAlignment="flex-start"
			orientation="horizontal"
			$darkModeActive={isDarkModeEnabled}
		>
			{(isDesktopView || !infoPanelOpen) && (
				<Chat roomId={roomId} setInfoPanelOpen={setInfoPanelOpen} />
			)}
			{(isDesktopView || infoPanelOpen) && (
				<ConversationInfoPanel
					roomId={roomId}
					setInfoPanelOpen={setInfoPanelOpen}
					infoPanelOpen={infoPanelOpen}
				/>
			)}
		</ConversationWrapper>
	);
};

export default Conversation;
