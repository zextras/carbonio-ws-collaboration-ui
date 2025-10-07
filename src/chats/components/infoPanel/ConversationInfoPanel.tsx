/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { ActionsAccordion } from './conversationActionsAccordion/ActionsAccordion';
import ConversationInfo from './conversationInfo/ConversationInfo';
import ConversationInfoDetails from './conversationInfo/ConversationInfoDetails';
import { MemberAccordion } from './conversationParticipantsAccordion/MemberAccordion';
import { getRoomTypeSelector, getIsPlaceholderRoom } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';

type ConversationProps = {
	roomId: string;
	goToChatView: () => void;
};

const ConversationInfoPanel: FC<ConversationProps> = ({ roomId, goToChatView }) => {
	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));
	const isPlaceholderRoom = useStore((state) => getIsPlaceholderRoom(state, roomId));

	return (
		<Container>
			<ConversationInfo roomId={roomId} roomType={roomType} goToChatView={goToChatView} />
			<Container mainAlignment="flex-start" style={{ overflowY: 'auto' }}>
				<ConversationInfoDetails roomId={roomId} roomType={roomType} />
				{!isPlaceholderRoom && <ActionsAccordion roomId={roomId} />}
				{roomType !== RoomType.ONE_TO_ONE && <MemberAccordion roomId={roomId} />}
			</Container>
		</Container>
	);
};

export default ConversationInfoPanel;
