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
	meetingId?: string;
};

export const ActionsAccordion: FC<ActionAccordionProps> = ({ roomId, meetingId }) => {
	const [t] = useTranslation();
	const actionAccordionTitle: string = t('conversationInfo.actionAccordionTitle', 'Actions');
	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const iAmOwner: boolean = useStore((state) => getOwnershipOfTheRoom(state, roomId));
	const numberOfOwners: number = useStore((state) => getNumberOfOwnersOfTheRoom(state, roomId));
	const emptyRoom: boolean = useStore((state) => roomIsEmpty(state, roomId));
	const accordionStatus: boolean = useStore((state) => getActionsAccordionStatus(state, roomId));
	const setActionsAccordionStatus = useStore((state) => state.setActionsAccordionStatus);

	const toggleAccordionStatus = useCallback(() => {
		setActionsAccordionStatus(roomId, !accordionStatus);
	}, [accordionStatus, roomId, setActionsAccordionStatus]);

	const infoDetails = useMemo(() => {
		const arrayOfActions: AccordionItemType[] = [];
		const bkgColor = 'gray6';

		// Mute conversation
		arrayOfActions.push({
			id: '1',
			disableHover: true,
			background: bkgColor,
			CustomComponent: () => (
				<MuteConversationAction roomId={roomId} roomType={roomType} emptyRoom={emptyRoom} />
			)
		});

		// Edit conversation info
		if (iAmOwner && roomType !== RoomType.ONE_TO_ONE) {
			arrayOfActions.push({
				id: '2',
				disableHover: true,
				background: bkgColor,
				CustomComponent: () => <EditConversationAction roomId={roomId} />
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
					/>
				)
			});
		}

		// Delete conversation
		if (iAmOwner && roomType !== RoomType.ONE_TO_ONE) {
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
				open: accordionStatus,
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
		actionAccordionTitle,
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
			background={'gray5'}
		/>
	);
};
