/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, IconButton, Tooltip, Icon } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PromoteDemoteMemberAction from '../../../../chats/components/infoPanel/conversationParticipantsAccordion/PromoteDemoteMemberAction';
import { getRoomIdByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import { getMyOwnershipOfTheRoom, getOwner } from '../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';

type ParticipantActionsProps = {
	memberId: string;
	isInsideMeeting?: boolean | undefined;
	meetingId?: string | undefined;
};
const MeetingParticipantActions: FC<ParticipantActionsProps> = ({ memberId, meetingId }) => {
	const [t] = useTranslation();
	const memberIsModeratorLabel: string = t(
		'tooltip.memberIsModerator',
		'This member is a moderator'
	);
	const userId: string | undefined = useStore((store) => getUserId(store));
	const roomId: string | undefined = useStore((store) =>
		getRoomIdByMeetingId(store, meetingId || '')
	);
	const memberOwner: boolean = useStore((store) => getOwner(store, roomId || '', memberId));
	const iAmOwner: boolean = useStore((state) =>
		getMyOwnershipOfTheRoom(state, userId, roomId || '')
	);

	const [isPinned, setIsPinned] = useState<boolean>(false);
	const [isMuted, setIsMuted] = useState<boolean>(false);

	const isSessionParticipant: boolean = useMemo(() => memberId === userId, [memberId, userId]);

	const togglePin = useCallback(() => {
		setIsPinned((prevState) => !prevState);
	}, []);

	const toggleMute = useCallback(() => {
		setIsMuted((prevState) => !prevState);
	}, []);

	return (
		<Container width="fit" height="fit" orientation="horizontal">
			{iAmOwner ? (
				<PromoteDemoteMemberAction
					memberId={memberId}
					roomId={roomId || ''}
					isSessionParticipant={isSessionParticipant}
					owner={memberOwner}
					isInsideMeeting
				/>
			) : (
				memberOwner && (
					<Tooltip label={memberIsModeratorLabel}>
						<Icon iconColor="gray0" icon="Crown" size="medium" />
					</Tooltip>
				)
			)}
			{iAmOwner && !isSessionParticipant && (
				<Tooltip label={isMuted ? 'This participant is already muted' : 'Mute for all'}>
					<IconButton
						iconColor="gray0"
						backgroundColor="gray6"
						icon={isMuted ? 'MicOff' : 'MicOffOutline'}
						onClick={toggleMute}
						size="large"
					/>
				</Tooltip>
			)}
			{!isSessionParticipant && (
				<Tooltip label={isPinned ? 'Unpin video' : 'Pin video'}>
					<IconButton
						iconColor="gray0"
						backgroundColor="gray6"
						icon={isPinned ? 'Unpin3Outline' : 'Pin3Outline'}
						onClick={togglePin}
						size="large"
					/>
				</Tooltip>
			)}
		</Container>
	);
};

export default MeetingParticipantActions;
