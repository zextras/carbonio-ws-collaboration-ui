/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	getMyOwnershipOfTheRoom,
	getNumberOfOwnersOfTheRoom,
	getNumbersOfRoomMembers
} from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { Member } from '../../../types/store/RoomTypes';
import GoToPrivateChatAction from './GoToPrivateChatAction';
import LeaveConversationListAction from './LeaveConversationListAction';
import PromoteDemoteMemberAction from './PromoteDemoteMemberAction';
import RemoveMemberListAction from './RemoveMemberListAction';

type ActionsProps = {
	roomId: string;
	member: Member;
};

const ParticipantComponentActions: FC<ActionsProps> = ({ roomId, member }) => {
	const [t] = useTranslation();
	const memberIsModeratorLabel: string = t(
		'tooltip.memberIsModerator',
		'This member is a moderator'
	);

	const sessionId: string | undefined = useStore((state) => state.session.id);
	const numberOfOwners: number = useStore((state) => getNumberOfOwnersOfTheRoom(state, roomId));
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const iAmOwner: boolean = useStore((state) => getMyOwnershipOfTheRoom(state, sessionId, roomId));
	const isSessionParticipant: boolean = useMemo(
		() => member.userId === sessionId,
		[member.userId, sessionId]
	);

	return (
		<Container orientation="horizontal" mainAlignment="flex-end">
			{!isSessionParticipant && <GoToPrivateChatAction memberId={member.userId} />}

			{iAmOwner ? (
				<PromoteDemoteMemberAction
					memberId={member.userId}
					roomId={roomId}
					isSessionParticipant={isSessionParticipant}
					owner={member.owner}
				/>
			) : (
				member.owner && (
					<Tooltip label={memberIsModeratorLabel}>
						<IconButton iconColor="primary" size="extralarge" icon="Crown" disabled />
					</Tooltip>
				)
			)}

			{isSessionParticipant ? (
				<LeaveConversationListAction
					iAmOwner={iAmOwner}
					numberOfMembers={numberOfMembers}
					isSessionParticipant={isSessionParticipant}
					numberOfOwners={numberOfOwners}
					roomId={roomId}
				/>
			) : (
				iAmOwner && <RemoveMemberListAction memberId={member.userId} roomId={roomId} />
			)}
		</Container>
	);
};

export default ParticipantComponentActions;
