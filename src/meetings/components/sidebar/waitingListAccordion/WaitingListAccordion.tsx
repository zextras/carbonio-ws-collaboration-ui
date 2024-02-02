/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Accordion, AccordionItemType } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import WaitingUser from './WaitingUser';
import { getWaitingListAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import { getMyOwnershipOfTheRoom } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type WaitingListAccordionProps = {
	meetingId: string;
};

const WaitingListAccordion: FC<WaitingListAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const accordionTitle = t('', 'Waiting list');

	const waitingList = useMemo(
		() => ['fa61cbab-fba1-4cf3-b26a-945ea648dcb2', 'b4e34652-c178-4475-aeaf-df0358f07c20'],
		[]
	);
	const accordionStatus = useStore((state) => getWaitingListAccordionStatus(state, meetingId));
	const setParticipantsAccordionStatus = useStore((state) => state.setWaitingListAccordionStatus);
	const sessionId = useStore((store) => store.session.id);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const amIModerator = useStore((store) => getMyOwnershipOfTheRoom(store, sessionId, roomId || ''));

	const toggleAccordionStatus = useCallback(
		() => setParticipantsAccordionStatus(meetingId, !accordionStatus),
		[accordionStatus, meetingId, setParticipantsAccordionStatus]
	);

	const items = useMemo(() => {
		const waitingUsers: AccordionItemType[] = map(waitingList, (userId) => ({
			id: `waitingUser-${userId}`,
			disableHover: true,
			background: 'text',
			CustomComponent: () => <WaitingUser meetingId={meetingId} userId={userId} />
		}));
		return [
			{
				id: 'waitingListAccordion',
				label: accordionTitle,
				open: accordionStatus,
				items: waitingUsers,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus
			}
		];
	}, [accordionStatus, accordionTitle, meetingId, toggleAccordionStatus, waitingList]);

	if (!amIModerator || size(waitingList) === 0) return null;
	return <CustomAccordion items={items} borderRadius="none" background="gray0" />;
};

export default WaitingListAccordion;
