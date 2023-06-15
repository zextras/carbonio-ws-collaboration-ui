/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import GoToPrivateChatAction from './GoToPrivateChatAction';
import LeaveConversationListAction from './LeaveConversationListAction';
import PromoteDemoteMemberAction from './PromoteDemoteMemberAction';
import RemoveMemberListAction from './RemoveMemberListAction';
import { roomHasMoreThanTwoOwnerEqualityFn } from '../../../../store/equalityFunctions/RoomsEqualityFunctions';
import {
	getOwner,
	getMyOwnershipOfTheRoom,
	getNumberOfOwnersOfTheRoom,
	getNumbersOfRoomMembers
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';

type ActionsProps = {
	roomId: string;
	memberId: string;
};

const MemberComponentActions: FC<ActionsProps> = ({ roomId, memberId }) => {
	const [t] = useTranslation();
	const memberIsModeratorLabel: string = t(
		'tooltip.memberIsModerator',
		'This member is a moderator'
	);

	const sessionId: string | undefined = useStore((state) => state.session.id);
	const numberOfOwners: number = useStore(
		(state) => getNumberOfOwnersOfTheRoom(state, roomId),
		roomHasMoreThanTwoOwnerEqualityFn
	);
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const memberOwner: boolean = useStore((store) => getOwner(store, roomId, memberId));
	const iAmOwner: boolean = useStore((state) => getMyOwnershipOfTheRoom(state, sessionId, roomId));

	const isSessionParticipant: boolean = useMemo(
		() => memberId === sessionId,
		[memberId, sessionId]
	);

	return (
		<Container orientation="horizontal" mainAlignment="flex-end">
			{!isSessionParticipant && <GoToPrivateChatAction memberId={memberId} />}

			{iAmOwner ? (
				<PromoteDemoteMemberAction
					memberId={memberId}
					roomId={roomId}
					isSessionParticipant={isSessionParticipant}
					owner={memberOwner}
				/>
			) : (
				memberOwner && (
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
				iAmOwner && <RemoveMemberListAction memberId={memberId} roomId={roomId} />
			)}
		</Container>
	);
};

export default MemberComponentActions;