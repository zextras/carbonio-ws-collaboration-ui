/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Accordion, AccordionItemType, Container } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import WaitingUser from './WaitingUser';
import { getWaitingListAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getWaitingList } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingAccordionType } from '../../../../types/store/ActiveMeetingTypes';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type WaitingListAccordionProps = {
	meetingId: string;
};

const WaitingListAccordion: FC<WaitingListAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const accordionTitle = t('meeting.sidebar.waitingList', 'Waiting list');

	const waitingList = useStore((store) => getWaitingList(store, meetingId));
	const accordionStatus = useStore(getWaitingListAccordionStatus);
	const setMeetingSidebarStatus = useStore((state) => state.setMeetingSidebarStatus);

	const toggleAccordionStatus = useCallback(
		() => setMeetingSidebarStatus(MeetingAccordionType.WAITING_LIST, !accordionStatus),
		[accordionStatus, setMeetingSidebarStatus]
	);

	const items = useMemo(() => {
		const waitingListContainer: AccordionItemType[] = [
			{
				id: 'waitingListContainer',
				disableHover: true,
				background: 'text',
				CustomComponent: () => (
					<Container padding={{ vertical: 'large', right: 'small' }} gap="0.5rem">
						{map(waitingList, (userId) => (
							<WaitingUser meetingId={meetingId} userId={userId} key={userId} />
						))}
					</Container>
				)
			}
		];
		return [
			{
				id: 'waitingListAccordion',
				label: accordionTitle,
				open: accordionStatus,
				items: waitingListContainer,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus,
				badgeCounter: accordionStatus ? undefined : waitingList.length,
				badgeType: 'unread'
			} as AccordionItemType
		];
	}, [accordionStatus, accordionTitle, meetingId, toggleAccordionStatus, waitingList]);

	if (size(waitingList) === 0) return null;
	return <CustomAccordion items={items} borderRadius="none" background={'gray0'} />;
};

export default WaitingListAccordion;
