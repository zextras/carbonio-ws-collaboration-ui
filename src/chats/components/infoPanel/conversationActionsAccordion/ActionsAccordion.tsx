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
};

export const ActionsAccordion: FC<ActionAccordionProps> = ({ roomId }) => {
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

	const editComponent = useMemo(() => <EditConversationAction roomId={roomId} />, [roomId]);

	const muteComponent = useMemo(
		() => <MuteConversationAction roomId={roomId} roomType={roomType} emptyRoom={emptyRoom} />,
		[emptyRoom, roomId, roomType]
	);

	const addNewMemberComponent = useMemo(() => <AddNewMemberAction roomId={roomId} />, [roomId]);

	const clearComponent = useMemo(
		() => <ClearHistoryAction roomId={roomId} roomType={roomType} />,
		[roomId, roomType]
	);

	const leaveConversationComponent = useMemo(
		() => (
			<LeaveConversationAction
				roomId={roomId}
				type={roomType}
				iAmOneOfOwner={iAmOwner && numberOfOwners !== 1}
			/>
		),
		[iAmOwner, numberOfOwners, roomId, roomType]
	);

	const deleteConversationComponent = useMemo(
		() => (
			<DeleteConversationAction roomId={roomId} type={roomType} numberOfMembers={numberOfMembers} />
		),
		[numberOfMembers, roomId, roomType]
	);

	const infoDetails = useMemo(() => {
		const arrayOfActions: AccordionItemType[] = [];

		// Mute conversation
		arrayOfActions.push({
			id: '1',
			disableHover: true,
			background: 'gray6',
			CustomComponent: () => muteComponent
		});

		// Edit conversation info
		if (iAmOwner && roomType !== RoomType.ONE_TO_ONE) {
			arrayOfActions.push({
				id: '2',
				disableHover: true,
				background: 'gray6',
				CustomComponent: () => editComponent
			});

			// Add member to conversation
			arrayOfActions.push({
				id: '3',
				disableHover: true,
				background: 'gray6',
				CustomComponent: () => addNewMemberComponent
			});
		}

		// Clear conversation history
		if (!emptyRoom) {
			arrayOfActions.push({
				id: '4',
				disableHover: true,
				background: 'gray6',
				CustomComponent: () => clearComponent
			});
		}

		// Leave conversation
		if ((!iAmOwner || (iAmOwner && numberOfOwners !== 1)) && roomType === RoomType.GROUP) {
			arrayOfActions.push({
				id: '5',
				disableHover: true,
				background: 'gray6',
				CustomComponent: () => leaveConversationComponent
			});
		}

		// Delete conversation
		if (iAmOwner && roomType !== RoomType.ONE_TO_ONE) {
			arrayOfActions.push({
				id: '6',
				disableHover: true,
				background: 'gray6',
				CustomComponent: () => deleteConversationComponent
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
		muteComponent,
		editComponent,
		addNewMemberComponent,
		clearComponent,
		leaveConversationComponent,
		deleteConversationComponent
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
