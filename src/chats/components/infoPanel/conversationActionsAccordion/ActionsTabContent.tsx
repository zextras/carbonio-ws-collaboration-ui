/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import AddNewMemberAction from './AddNewMemberAction';
import ClearHistoryAction from './ClearHistoryAction';
import DeleteConversationAction from './DeleteConversationAction';
import EditConversationAction from './EditConversationAction';
import LeaveConversationAction from './LeaveConversationAction';
import MuteConversationAction from './MuteConversationAction';
import { roomIsEmpty } from '../../../../store/selectors/ChatsRegistrySelectors';
import {
	getOwnershipOfTheRoom,
	getNumberOfOwnersOfTheRoom,
	getNumbersOfRoomMembers,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type ActionsTabContentProps = {
	roomId: string;
};

export const ActionsTabContent: FC<ActionsTabContentProps> = ({ roomId }) => {
	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const iAmOwner: boolean = useStore((state) => getOwnershipOfTheRoom(state, roomId));
	const numberOfOwners: number = useStore((state) => getNumberOfOwnersOfTheRoom(state, roomId));
	const emptyRoom: boolean = useStore((state) => roomIsEmpty(state, roomId));

	return (
		<Container
			data-testid="actionsTabContent"
			background="gray6"
			mainAlignment="flex-start"
			height="fit"
			padding={{ left: 'large', right: 'small' }}
		>
			<MuteConversationAction roomId={roomId} roomType={roomType} emptyRoom={emptyRoom} />
			{iAmOwner && roomType !== RoomType.ONE_TO_ONE && <EditConversationAction roomId={roomId} />}
			{iAmOwner && roomType !== RoomType.ONE_TO_ONE && <AddNewMemberAction roomId={roomId} />}
			{!emptyRoom && <ClearHistoryAction roomId={roomId} roomType={roomType} />}
			{(!iAmOwner || (iAmOwner && numberOfOwners !== 1)) && roomType === RoomType.GROUP && (
				<LeaveConversationAction
					roomId={roomId}
					type={roomType}
					iAmOneOfOwner={iAmOwner && numberOfOwners !== 1}
				/>
			)}
			{iAmOwner && roomType !== RoomType.ONE_TO_ONE && (
				<DeleteConversationAction
					roomId={roomId}
					type={roomType}
					numberOfMembers={numberOfMembers}
				/>
			)}
		</Container>
	);
};
