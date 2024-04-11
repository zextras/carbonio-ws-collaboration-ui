/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Accordion, AccordionItemType } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import AddNewMemberAction from './AddNewMemberAction';
import ClearHistoryAction from './ClearHistoryAction';
import DeleteConversationAction from './DeleteConversationAction';
import EditConversationAction from './EditConversationAction';
import LeaveConversationAction from './LeaveConversationAction';
import MuteConversationAction from './MuteConversationAction';
import { getActionsAccordionStatus } from '../../../../store/selectors/ActiveConversationsSelectors';
import { getMeetingActionsAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import { roomIsEmpty } from '../../../../store/selectors/MessagesSelectors';
import {
	getOwnershipOfTheRoom,
	getNumberOfOwnersOfTheRoom,
	getNumbersOfRoomMembers,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type ActionAccordionProps = {
	roomId: string;
	isInsideMeeting?: boolean;
	meetingId?: string;
};

export const ActionsAccordion: FC<ActionAccordionProps> = ({
	roomId,
	isInsideMeeting,
	meetingId
}) => {
	const [t] = useTranslation();
	const actionAccordionTitle: string = t('conversationInfo.actionAccordionTitle', 'Actions');
	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const iAmOwner: boolean = useStore((state) => getOwnershipOfTheRoom(state, roomId));
	const numberOfOwners: number = useStore((state) => getNumberOfOwnersOfTheRoom(state, roomId));
	const emptyRoom: boolean = useStore((state) => roomIsEmpty(state, roomId));
	const accordionStatus: boolean = useStore((state) => getActionsAccordionStatus(state, roomId));
	const meetingAccordionStatus: boolean = useStore((state) =>
		getMeetingActionsAccordionStatus(state, meetingId || '')
	);

	const setActionsAccordionStatus = useStore((state) => state.setActionsAccordionStatus);

	const setMeetingActionsAccordionStatus = useStore(
		(state) => state.setMeetingActionsAccordionStatus
	);

	const toggleAccordionStatus = useCallback(() => {
		isInsideMeeting
			? setMeetingActionsAccordionStatus(meetingId || '', !meetingAccordionStatus)
			: setActionsAccordionStatus(roomId, !accordionStatus);
	}, [
		accordionStatus,
		isInsideMeeting,
		meetingAccordionStatus,
		meetingId,
		roomId,
		setActionsAccordionStatus,
		setMeetingActionsAccordionStatus
	]);

	const infoDetails = useMemo(() => {
		const arrayOfActions: AccordionItemType[] = [];
		const bkgColor = isInsideMeeting ? 'text' : 'gray6';

		// Mute conversation
		arrayOfActions.push({
			id: '1',
			disableHover: true,
			background: bkgColor,
			CustomComponent: () => (
				<MuteConversationAction
					roomId={roomId}
					isInsideMeeting={isInsideMeeting}
					roomType={roomType}
					emptyRoom={emptyRoom}
				/>
			)
		});

		// Edit conversation info
		if (iAmOwner && roomType !== RoomType.ONE_TO_ONE) {
			arrayOfActions.push({
				id: '2',
				disableHover: true,
				background: bkgColor,
				CustomComponent: () => (
					<EditConversationAction roomId={roomId} isInsideMeeting={isInsideMeeting} />
				)
			});

			// Add member to conversation
			arrayOfActions.push({
				id: '3',
				disableHover: true,
				background: bkgColor,
				CustomComponent: () => (
					<AddNewMemberAction
						roomId={roomId}
						iAmTheOnlyOwner={iAmOwner && numberOfOwners === 1}
						isInsideMeeting={isInsideMeeting}
						emptyRoom={emptyRoom}
					/>
				)
			});
		}

		// Clear conversation history
		if (!emptyRoom) {
			arrayOfActions.push({
				id: '4',
				disableHover: true,
				background: bkgColor,
				CustomComponent: () => (
					<ClearHistoryAction
						roomId={roomId}
						roomType={roomType}
						isInsideMeeting={isInsideMeeting}
						iAmTheOnlyOwner={iAmOwner && numberOfOwners === 1}
					/>
				)
			});
		}

		// Leave conversation
		if ((!iAmOwner || (iAmOwner && numberOfOwners !== 1)) && roomType === RoomType.GROUP) {
			arrayOfActions.push({
				id: '5',
				disableHover: true,
				background: bkgColor,
				CustomComponent: () => (
					<LeaveConversationAction
						roomId={roomId}
						type={roomType}
						iAmOneOfOwner={iAmOwner && numberOfOwners !== 1}
						isInsideMeeting={isInsideMeeting}
					/>
				)
			});
		}

		// Delete conversation
		if (iAmOwner && roomType !== RoomType.ONE_TO_ONE && !isInsideMeeting) {
			arrayOfActions.push({
				id: '6',
				disableHover: true,
				background: bkgColor,
				CustomComponent: () => (
					<DeleteConversationAction
						roomId={roomId}
						type={roomType}
						numberOfMembers={numberOfMembers}
					/>
				)
			});
		}

		return [
			{
				id: 'ActionsAccordion',
				label: actionAccordionTitle,
				open: isInsideMeeting ? meetingAccordionStatus : accordionStatus,
				items: arrayOfActions,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus
			}
		];
	}, [
		iAmOwner,
		roomType,
		emptyRoom,
		numberOfOwners,
		isInsideMeeting,
		actionAccordionTitle,
		meetingAccordionStatus,
		accordionStatus,
		toggleAccordionStatus,
		roomId,
		numberOfMembers
	]);

	return (
		<CustomAccordion
			key="listAccordions"
			data-testid="actionsAccordion"
			items={infoDetails}
			borderRadius="none"
			background={isInsideMeeting ? 'gray0' : 'gray5'}
		/>
	);
};
