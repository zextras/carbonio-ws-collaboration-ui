/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';

import { ActionsAccordion } from './conversationActionsAccordion/ActionsAccordion';
import ConversationInfo from './conversationInfo/ConversationInfo';
import ConversationInfoDetails from './conversationInfo/ConversationInfoDetails';
import { MemberAccordion } from './conversationParticipantsAccordion/MemberAccordion';
import { getRoomTypeSelector, getIsPlaceholderRoom } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';

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
	toggleInfoPanel: () => void;
};

const ConversationInfoPanel: FC<ConversationProps> = ({ roomId, toggleInfoPanel }) => {
	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));
	const isPlaceholderRoom = useStore((state) => getIsPlaceholderRoom(state, roomId));

	return (
		<CustomContainer mainAlignment="flex-start">
			<ConversationInfoContainer>
				<ConversationInfo roomId={roomId} roomType={roomType} toggleInfoPanel={toggleInfoPanel} />
			</ConversationInfoContainer>
			<AccordionsContainer>
				<ConversationInfoDetails roomId={roomId} roomType={roomType} />
				{!isPlaceholderRoom && <ActionsAccordion roomId={roomId} />}
				{roomType !== RoomType.ONE_TO_ONE && <MemberAccordion roomId={roomId} />}
			</AccordionsContainer>
		</CustomContainer>
	);
};

export default ConversationInfoPanel;
