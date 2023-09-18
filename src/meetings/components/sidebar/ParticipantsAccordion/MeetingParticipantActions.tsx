/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Tooltip, Icon, Padding } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
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
	// const muteForAllLabel = t('tooltip.muteForAll', 'Mute for all');
	// const pinVideoLabel = t('tooltip.pinVideo', 'Pin video');
	// const unpinVideoLabel = t('tooltip.unpinVideo', 'Unpin video');
	const userId: string | undefined = useStore((store) => getUserId(store));
	const roomId: string | undefined = useStore((store) =>
		getRoomIdByMeetingId(store, meetingId || '')
	);
	const participantAudioStatus = useStore((store) =>
		getParticipantAudioStatus(store, meetingId || '', memberId)
	);
	const memberOwner: boolean = useStore((store) => getOwner(store, roomId || '', memberId));
	const iAmOwner: boolean = useStore((state) =>
		getMyOwnershipOfTheRoom(state, userId, roomId || '')
	);

	const isSessionParticipant: boolean = useMemo(() => memberId === userId, [memberId, userId]);

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
							<Icon icon="Crown" size="medium" />
						</Padding>
					</Tooltip>
				)
			)}
			{!participantAudioStatus && (
				<Tooltip label={participantAlreadyMutedLabel}>
					<Padding all="0.5rem">
						<Icon icon="MicOff" size="medium" />
					</Padding>
				</Tooltip>
			)}
			{/*	TODO MUTE FOR ALL FEATURE */}
			{/* <Tooltip label={muteForAllLabel}> */}
			{/*	<IconButton */}
			{/*		iconColor="gray0" */}
			{/*		backgroundColor="text" */}
			{/*		icon="MicOffOutline" */}
			{/*		onClick={() => {}) */}
			{/*		size="large" */}
			{/*	/> */}
			{/* </Tooltip> */}

			{/* TODO PIN VIDEO FEATURE */}
			{/* {isSessionParticipant && ( */}
			{/*	<Tooltip label={isPinned ? unpinVideoLabel : pinVideoLabel}> */}
			{/*		<IconButton */}
			{/*			iconColor="gray0" */}
			{/*			backgroundColor="text" */}
			{/*			icon={isPinned ? 'Unpin3Outline' : 'Pin3Outline'} */}
			{/*			onClick={togglePin} */}
			{/*			size="large" */}
			{/*		/> */}
			{/*	</Tooltip> */}
			{/* )} */}
		</Container>
	);
};

export default MeetingParticipantActions;
