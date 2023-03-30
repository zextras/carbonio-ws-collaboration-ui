/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { Dispatch, FC, SetStateAction } from 'react';
import styled from 'styled-components';

import { ActionsAccordion } from './conversationActionsAccordion/ActionsAccordion';
import ConversationInfo from './conversationInfo/ConversationInfo';
import ConversationInfoDetails from './conversationInfo/ConversationInfoDetails';
import { ParticipantsAccordion } from './conversationParticipantsAccordion/ParticipantsAccordion';
import { getRoomTypeSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { RoomType } from '../../types/store/RoomTypes';

const ConversationInfoContainer = styled(Container)`
	height: fit-content;
	position: sticky;
	top: 0;
	z-index: 1;
`;

const CustomContainer = styled(Container)`
	border-left: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	position: relative;
	overflow-y: auto;
	background-color: white;
`;

const AccordionsContainer = styled(Container)`
	height: fit-content;
`;

type ConversationProps = {
	roomId: string;
	infoPanelOpen: boolean;
	setInfoPanelOpen: Dispatch<SetStateAction<boolean>>;
};

const ConversationInfoPanel: FC<ConversationProps> = ({
	roomId,
	infoPanelOpen,
	setInfoPanelOpen
}) => {
	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));

	return (
		<CustomContainer
			data-testid={`conversationInfoPanel${infoPanelOpen ? 'Open' : 'Collapsed'}`}
			width={infoPanelOpen ? '100%' : '30%'}
			mainAlignment="flex-start"
		>
			<ConversationInfoContainer>
				<ConversationInfo roomId={roomId} roomType={roomType} setInfoPanelOpen={setInfoPanelOpen} />
			</ConversationInfoContainer>
			<AccordionsContainer>
				<ConversationInfoDetails roomId={roomId} roomType={roomType} />
				<ActionsAccordion roomId={roomId} />
				{roomType !== RoomType.ONE_TO_ONE && <ParticipantsAccordion roomId={roomId} />}
			</AccordionsContainer>
		</CustomContainer>
	);
};

export default ConversationInfoPanel;
