/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, IconButton, Tooltip, Icon, Padding } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PromoteDemoteMemberAction from '../../../../chats/components/infoPanel/conversationParticipantsAccordion/PromoteDemoteMemberAction';
import {
	getParticipantAudioStatus,
	getRoomIdByMeetingId
} from '../../../../store/selectors/MeetingSelectors';
import { getMyOwnershipOfTheRoom, getOwner } from '../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';

type ParticipantActionsProps = {
	memberId: string;
	meetingId?: string;
};
const MeetingParticipantActions: FC<ParticipantActionsProps> = ({ memberId, meetingId }) => {
	const [t] = useTranslation();
	const memberIsModeratorLabel: string = t(
		'tooltip.memberIsModerator',
		'This member is a moderator'
	);
	const participantAlreadyMutedLabel = t(
		'tooltip.participantAlreadyMuted',
		'This participant is already muted'
	);
	const muteForAllLabel = t('tooltip.muteForAll', 'Mute for all');
	const pinVideoLabel = t('tooltip.pinVideo', 'Pin video');
	const unpinVideoLabel = t('tooltip.unpinVideo', 'Unpin video');
	const userId: string | undefined = useStore((store) => getUserId(store));
	const roomId: string | undefined = useStore((store) =>
		getRoomIdByMeetingId(store, meetingId || '')
	);
	const participantAudioStatus = useStore((store) =>
		getParticipantAudioStatus(store, roomId || '', memberId)
	);
	const memberOwner: boolean = useStore((store) => getOwner(store, roomId || '', memberId));
	const iAmOwner: boolean = useStore((state) =>
		getMyOwnershipOfTheRoom(state, userId, roomId || '')
	);

	const [isPinned, setIsPinned] = useState<boolean>(false);
	const [isMuted, setIsMuted] = useState<boolean>(!participantAudioStatus);

	const isSessionParticipant: boolean = useMemo(() => memberId === userId, [memberId, userId]);

	const togglePin = useCallback(() => {
		setIsPinned((prevState) => !prevState);
	}, []);

	const muteUser = useCallback(() => {
		setIsMuted(true);
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
						<Padding all="0.5rem">
							<Icon iconColor="gray0" icon="Crown" size="medium" />
						</Padding>
					</Tooltip>
				)
			)}
			{iAmOwner &&
				!isSessionParticipant &&
				(isMuted ? (
					<Tooltip label={participantAlreadyMutedLabel}>
						<Padding all="0.5rem">
							<Icon icon="MicOff" iconColor="gray0" size="medium" />
						</Padding>
					</Tooltip>
				) : (
					<Tooltip label={muteForAllLabel}>
						<IconButton
							iconColor="gray0"
							backgroundColor="gray6"
							icon="MicOffOutline"
							onClick={muteUser}
							size="large"
						/>
					</Tooltip>
				))}
			{!isSessionParticipant && (
				<Tooltip label={isPinned ? unpinVideoLabel : pinVideoLabel}>
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
