/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import Chat from '../../../chats/components/conversation/Chat';
import { getRoomIdByMeetingId } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { WrapperMeetingChat } from '../sidebar/MeetingConversationAccordion/MeetingConversationAccordion';

const MobileConversation = ({ meetingId }: { meetingId: string }): ReactElement | null => {
	const [t] = useTranslation();
	const chatLabel = t('chat', 'Chat');

	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));

	if (!roomId) return null;
	return (
		<Container crossAlignment="flex-start">
			<Padding all="1rem">
				<Text>{chatLabel}</Text>
			</Padding>
			<WrapperMeetingChat $darkModeActive>
				<Chat roomId={roomId} />
			</WrapperMeetingChat>
		</Container>
	);
};

export default MobileConversation;
