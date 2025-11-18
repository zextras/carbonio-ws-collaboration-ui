/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import {
	Accordion,
	AccordionItemType,
	Button,
	Container,
	CreateSnackbarFn,
	Snackbar,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import RaiseHandUser from './RaiseHandUser';
import useEventListener, {
	EventName,
	MeetingParticipantRaiseHandEvent
} from '../../../../hooks/useEventListener';
import { MeetingsApi } from '../../../../network';
import {
	getHandRaisedList,
	getRaiseHandAccordionStatus
} from '../../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import { getOwnershipOfTheRoom } from '../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { MeetingAccordionType } from '../../../../types/store/ActiveMeetingTypes';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type RaiseHandAccordionProps = {
	meetingId: string;
};

const RaiseHandAccordion: FC<RaiseHandAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const raiseHandList = useStore(getHandRaisedList);

	const okLabel = t('action.ok', 'Ok');
	const lowerAllHandLabel = t('meeting.sidebar.lowerAllHands', 'Lower all raised hand');
	const someoneRaisedHandLabel = t('meeting.snackbar.someoneRaisedHand', 'Someone raised his hand');
	const handLoweredLabel = t(
		'meeting.snackbar.handLoweredByModerator',
		'A moderator lowered your hand'
	);
	const accordionTitle = t('meeting.sidebar.raiseHand', `${raiseHandList?.length} raised hands`, {
		numberOfHandRaised: raiseHandList?.length
	});

	const accordionStatus = useStore(getRaiseHandAccordionStatus);
	const setMeetingSidebarStatus = useStore((state) => state.setMeetingSidebarStatus);
	const myUserId = useStore(getUserId);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId ?? ''));

	const [someoneRaisedHandSnackbar, setSomeoneRaisedHandSnackbar] = useState(false);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	useEffect(() => {
		if (size(raiseHandList) === 0) {
			setSomeoneRaisedHandSnackbar(false);
		}
	}, [raiseHandList]);

	const handleRaiseHandEvent = useCallback(
		(event: CustomEvent<MeetingParticipantRaiseHandEvent['data']> | undefined) => {
			const { raised, userId, moderatorId } = event?.detail ?? {};
			const isSomeoneElseRaising = raised && amIModerator && userId !== myUserId;
			const isMyHandLoweredByModerator = !raised && userId === myUserId && moderatorId;

			if (isSomeoneElseRaising) setSomeoneRaisedHandSnackbar(true);

			if (isMyHandLoweredByModerator) {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'info',
					label: handLoweredLabel,
					hideButton: true,
					autoHideTimeout: 3000
				});
			}
		},
		[amIModerator, createSnackbar, handLoweredLabel, myUserId]
	);

	useEventListener(EventName.MEETING_PARTICIPANT_RAISE_HAND, handleRaiseHandEvent);

	const toggleAccordionStatus = useCallback(
		() => setMeetingSidebarStatus(MeetingAccordionType.RAISE_HAND, !accordionStatus),
		[accordionStatus, setMeetingSidebarStatus]
	);

	const lowerAllHands = useCallback(() => {
		map(raiseHandList, (userWithHandRaised) => {
			const userId = userWithHandRaised !== myUserId ? userWithHandRaised : undefined;
			MeetingsApi.raiseHand(meetingId, false, userId);
		});
	}, [meetingId, myUserId, raiseHandList]);

	const lowerButtonComponent = useMemo(
		() => (
			<Container padding={{ vertical: 'large', right: 'small' }} gap="0.5rem">
				<Button
					label={lowerAllHandLabel}
					backgroundColor="secondary"
					width="fill"
					onClick={lowerAllHands}
				/>
			</Container>
		),
		[lowerAllHandLabel, lowerAllHands]
	);

	const raiseHandUserComponent = useMemo(
		() => (
			<Container padding={{ vertical: 'large', right: 'small' }} gap="0.5rem">
				{map(raiseHandList, (userId) => (
					<RaiseHandUser meetingId={meetingId} userId={userId} key={userId} />
				))}
			</Container>
		),
		[meetingId, raiseHandList]
	);

	const items = useMemo(() => {
		const raiseHandContainer: AccordionItemType[] = [];
		if (amIModerator) {
			raiseHandContainer.push({
				id: 'lowerAllHands',
				disableHover: true,
				background: 'text',
				CustomComponent: () => lowerButtonComponent
			});
		}
		raiseHandContainer.push({
			id: 'raiseHandContainer',
			disableHover: true,
			background: 'text',
			CustomComponent: () => raiseHandUserComponent
		});
		return [
			{
				id: 'raiseHandAccordion',
				label: accordionTitle,
				open: accordionStatus,
				items: raiseHandContainer,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus
			} as AccordionItemType
		];
	}, [
		accordionStatus,
		accordionTitle,
		amIModerator,
		lowerButtonComponent,
		raiseHandUserComponent,
		toggleAccordionStatus
	]);

	if (size(raiseHandList) === 0) return null;
	return (
		<>
			<CustomAccordion items={items} borderRadius="none" background={'gray0'} />
			<Snackbar
				open={someoneRaisedHandSnackbar}
				onClose={(): void => setSomeoneRaisedHandSnackbar(false)}
				actionLabel={okLabel}
				disableAutoHide
				severity="info"
				label={someoneRaisedHandLabel}
			/>
		</>
	);
};

export default RaiseHandAccordion;
