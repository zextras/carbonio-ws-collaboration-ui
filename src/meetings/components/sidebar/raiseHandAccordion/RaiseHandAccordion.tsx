/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useRef } from 'react';

import {
	Accordion,
	AccordionItemType,
	Button,
	CloseSnackbarFn,
	Container,
	CreateSnackbarFn,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

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

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type RaiseHandAccordionProps = {
	meetingId: string;
};

const RaiseHandAccordion: FC<RaiseHandAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const raiseHandList = useStore((store) => getHandRaisedList(store, meetingId));

	const okLabel = t('action.ok', 'Ok');
	const lowerAllHandLabel = t('meeting.sidebar.lowerAllHands', 'Lower all raised hand');
	const someoneRaisedHandLabel = t('meeting.snackbar.someoneRaisedHand', 'someone raised his hand');
	const handLoweredLabel = t(
		'meeting.snackbar.handLoweredByModerator',
		'A moderator lowered your hand'
	);
	const accordionTitle = t('meeting.sidebar.raiseHand', `${raiseHandList?.length} raised hands`, {
		numberOfHandRaised: raiseHandList?.length
	});

	const accordionStatus = useStore((state) => getRaiseHandAccordionStatus(state, meetingId));
	const setRaiseHandAccordionStatus = useStore((state) => state.setRaiseHandAccordionStatus);
	const myUserId = useStore(getUserId);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId ?? ''));

	const createSnackbar: CreateSnackbarFn = useSnackbar();
	const closeSnackbarRef = useRef<CloseSnackbarFn | null>(null);

	const handleRaiseHandEvent = useCallback(
		(event: CustomEvent<MeetingParticipantRaiseHandEvent['data']> | undefined) => {
			const isSomeoneElseRaising =
				event?.detail.raised && amIModerator && event?.detail.userId !== myUserId;
			const isMyHandLoweredByModerator =
				!event?.detail.raised &&
				event?.detail.userId === myUserId &&
				event?.detail.moderatorId !== undefined &&
				event?.detail.moderatorId !== myUserId;
			const shouldModeratorCloseSnackbar = !event?.detail.raised && amIModerator;

			if (isSomeoneElseRaising) {
				closeSnackbarRef.current = createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'info',
					label: someoneRaisedHandLabel,
					actionLabel: okLabel,
					disableAutoHide: true
				});
			}

			if (isMyHandLoweredByModerator) {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'info',
					label: handLoweredLabel,
					hideButton: true,
					autoHideTimeout: 3000
				});
			}

			if (shouldModeratorCloseSnackbar && closeSnackbarRef.current) {
				closeSnackbarRef.current();
			}
		},
		[amIModerator, createSnackbar, handLoweredLabel, myUserId, okLabel, someoneRaisedHandLabel]
	);

	useEventListener(EventName.MEETING_PARTICIPANT_RAISE_HAND, handleRaiseHandEvent);

	const toggleAccordionStatus = useCallback(
		() => setRaiseHandAccordionStatus(meetingId, !accordionStatus),
		[accordionStatus, meetingId, setRaiseHandAccordionStatus]
	);

	const lowerAllHands = useCallback(() => {
		map(raiseHandList, (userWithHandRaised) => {
			MeetingsApi.raiseHand(meetingId, false, userWithHandRaised);
		});
	}, [meetingId, raiseHandList]);

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
	return <CustomAccordion items={items} borderRadius="none" background={'gray0'} />;
};

export default RaiseHandAccordion;
