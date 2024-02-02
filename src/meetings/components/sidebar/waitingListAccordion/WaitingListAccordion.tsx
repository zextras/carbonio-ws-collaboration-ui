/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Accordion, AccordionItemType, Container } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

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

	const waitingList = useMemo(() => ['aaa', 'bbb', 'ccc'], []);
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
			CustomComponent: () => <Container>{userId}</Container>
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
	}, [accordionStatus, accordionTitle, toggleAccordionStatus, waitingList]);

	if (!amIModerator || size(waitingList) === 0) return null;
	return <CustomAccordion items={items} borderRadius="none" background="gray0" />;
};

export default WaitingListAccordion;
