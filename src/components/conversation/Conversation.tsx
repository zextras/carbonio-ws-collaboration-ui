/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useEffect, useState } from 'react';
import styled from 'styled-components';

import papyrusDark from '../../assets/papyrus-dark.png';
import papyrus from '../../assets/papyrus.png';
import { ConversationProps } from '../../types/store/RoomTypes';
import useMediaQueryCheck from '../../utils/useMediaQueryCheck';
import ConversationInfoPanel from '../infoPanel/ConversationInfoPanel';
import ConversationHeader from './ConversationHeader';
import ConversationFooter from './footer/ConversationFooter';
import MessagesList from './MessagesList';

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
				<Container width={isDesktopView ? '70%' : '100%'} minWidth="70%" mainAlignment="flex-start">
					<ConversationHeader roomId={room.id} setInfoPanelOpen={setInfoPanelOpen} />
					<MessagesList roomId={room.id} />
					<ConversationFooter roomId={room.id} />
				</Container>
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
