/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import Chat from './Chat';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import { ConversationProps } from '../../../types/store/RoomTypes';
import papyrusDark from '../../assets/papyrus-dark.png';
import papyrus from '../../assets/papyrus.png';
import ConversationInfoPanel from '../infoPanel/ConversationInfoPanel';

const ConversationWrapper = styled(Container)`
	background-image: url('${(props): string => (props.theme === 'dark' ? papyrusDark : papyrus)}');
`;

const Conversation = ({ room }: ConversationProps): ReactElement => {
	const isDesktopView = useMediaQueryCheck();
	const [infoPanelOpen, setInfoPanelOpen] = useState(false);

	useEffect(() => {
		if (isDesktopView) {
			setInfoPanelOpen(false);
		}
	}, [isDesktopView]);

	return (
		<ConversationWrapper mainAlignment="flex-start" orientation="horizontal">
			{(isDesktopView || !infoPanelOpen) && (
				<Chat roomId={room.id} setInfoPanelOpen={setInfoPanelOpen} />
			)}
			{(isDesktopView || infoPanelOpen) && (
				<ConversationInfoPanel
					roomId={room.id}
					setInfoPanelOpen={setInfoPanelOpen}
					infoPanelOpen={infoPanelOpen}
				/>
			)}
		</ConversationWrapper>
	);
};

export default Conversation;
