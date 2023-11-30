/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import MeetingBubble from './MeetingBubble';
import useEventListener, { EventName } from '../../../hooks/useEventListener';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getMeetingSidebarStatus } from '../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { MessageType } from '../../../types/store/MessageTypes';

const CustomContainer = styled(Container)`
	z-index: 3;
	width: 370px;
`;
const BubblesWrapper = (): JSX.Element | null => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));

	const [messageIdsList, setMessageIdsList] = useState<string[]>([]);
	const [messageIdToRemove, setMessageIdToRemove] = useState<string>('');

	const newMessageHandler = useCallback(
		({ detail: messageFromEvent }) => {
			if (messageFromEvent.type === MessageType.TEXT_MSG) {
				setMessageIdsList([messageFromEvent.id, ...messageIdsList]);
			}
		},
		[messageIdsList]
	);

	useEffect(() => {
		const updatedList: string[] = [];
		map(messageIdsList, (message) => {
			if (message !== messageIdToRemove) updatedList.push(message);
		});
		setMessageIdsList(updatedList);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [messageIdToRemove]);

	const Bubbles = useMemo(
		() =>
			map(messageIdsList, (messageId) => (
				<MeetingBubble
					messageId={messageId}
					setMessageIdToRemove={setMessageIdToRemove}
					roomId={roomId || ''}
				/>
			)),
		[messageIdsList, roomId]
	);

	useEventListener(EventName.NEW_MESSAGE, newMessageHandler);

	const sidebarIsVisible: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	return !sidebarIsVisible ? (
		<CustomContainer mainAlignment={'flex-start'} crossAlignment={'flex-start'}>
			{Bubbles}
		</CustomContainer>
	) : null;
};

export default BubblesWrapper;
