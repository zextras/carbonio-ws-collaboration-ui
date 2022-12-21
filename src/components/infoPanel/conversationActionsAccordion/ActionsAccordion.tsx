/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Accordion } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getActionsAccordionStatus } from '../../../store/selectors/ActiveConversationsSelectors';
import { roomIsEmpty } from '../../../store/selectors/MessagesSelectors';
import {
	getMyOwnershipOfTheRoom,
	getNumberOfOwnersOfTheRoom,
	getRoomTypeSelector
} from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';
import AddNewMemberAction from './AddNewMemberAction';
import ClearHistoryAction from './ClearHistoryAction';
import DeleteConversationAction from './DeleteConversationAction';
import EditConversationAction from './EditConversationAction';
import LeaveConversationAction from './LeaveConversationAction';
import MuteConversationAction from './MuteConversationAction';

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
	const sessionId: string | undefined = useStore((state) => state.session.id);
	const iAmOwner: boolean = useStore((state) => getMyOwnershipOfTheRoom(state, sessionId, roomId));
	const numberOfOwners: number = useStore((state) => getNumberOfOwnersOfTheRoom(state, roomId));
	const emptyRoom: boolean = useStore((state) => roomIsEmpty(state, roomId));
	const accordionStatus: boolean = useStore((state) => getActionsAccordionStatus(state, roomId));
	const setActionsAccordionStatus = useStore((state) => state.setActionsAccordionStatus);

	const toggleAccordionStatus = useCallback(
		() => setActionsAccordionStatus(roomId, !accordionStatus),
		[accordionStatus, roomId, setActionsAccordionStatus]
	);

	const infoDetails = useMemo(() => {
		const arrayOfActions = [];

		// Mute conversation
		arrayOfActions.push({
			id: '1',
			disableHover: true,
			background: 'gray6',
			CustomComponent: () => <MuteConversationAction roomId={roomId} />
		});

		// Edit conversation info
		if (iAmOwner && roomType !== RoomType.ONE_TO_ONE) {
			arrayOfActions.push({
				id: '2',
				disableHover: true,
				background: 'gray6',
				CustomComponent: () => <EditConversationAction roomId={roomId} />
			});
		}

		// Add member to conversation
		if (iAmOwner && roomType !== RoomType.ONE_TO_ONE) {
			arrayOfActions.push({
				id: '3',
				disableHover: true,
				background: 'gray6',
				CustomComponent: () => <AddNewMemberAction roomId={roomId} />
			});
		}

		// Clear conversation history
		if (!emptyRoom) {
			arrayOfActions.push({
				id: '4',
				disableHover: true,
				background: 'gray6',
				CustomComponent: () => <ClearHistoryAction roomId={roomId} />
			});
		}

		// Leave conversation
		if ((!iAmOwner || (iAmOwner && numberOfOwners !== 1)) && roomType === RoomType.GROUP) {
			arrayOfActions.push({
				id: '5',
				disableHover: true,
				background: 'gray6',
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
				background: 'gray6',
				CustomComponent: () => <DeleteConversationAction roomId={roomId} type={roomType} />
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
		roomId
	]);

	return <CustomAccordion key="listAccordions" items={infoDetails} borderRadius="none" />;
};
