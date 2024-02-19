/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Accordion, AccordionItemType, Container, Snackbar } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import WaitingUser from './WaitingUser';
import useEventListener, { EventName } from '../../../../hooks/useEventListener';
import { getWaitingListAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId, getWaitingList } from '../../../../store/selectors/MeetingSelectors';
import { getOwnershipOfTheRoom } from '../../../../store/selectors/RoomsSelectors';
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
	const accordionTitle = t('meeting.sidebar.waitingList', 'Waiting list');
	const snackbarLabel = t(
		'meeting.snackbar.waitingInfo',
		'There seems to be someone in the waiting room'
	);

	const waitingList = useStore((store) => getWaitingList(store, meetingId));
	const accordionStatus = useStore((state) => getWaitingListAccordionStatus(state, meetingId));
	const setParticipantsAccordionStatus = useStore((state) => state.setWaitingListAccordionStatus);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId || ''));
	const [showSnackbar, setShowSnackbar] = useState(false);

	const newWaitingUser = useCallback(
		({ detail: newWaitingUserEvent }) => {
			if (newWaitingUserEvent.meetingId === meetingId && amIModerator) setShowSnackbar(true);
		},
		[amIModerator, meetingId]
	);
	useEventListener(EventName.NEW_WAITING_USER, newWaitingUser);

	useEffect(() => {
		if (size(waitingList) === 0) setShowSnackbar(false);
	}, [waitingList]);

	const toggleAccordionStatus = useCallback(
		() => setParticipantsAccordionStatus(meetingId, !accordionStatus),
		[accordionStatus, meetingId, setParticipantsAccordionStatus]
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

	if (!amIModerator) return null;
	return (
		<>
			{showSnackbar && (
				<Snackbar
					open={showSnackbar}
					key="newWaitingUser"
					type="info"
					label={snackbarLabel}
					disableAutoHide
				/>
			)}
			{size(waitingList) > 0 && (
				<CustomAccordion items={items} borderRadius="none" background="gray0" />
			)}
		</>
	);
};

export default WaitingListAccordion;
