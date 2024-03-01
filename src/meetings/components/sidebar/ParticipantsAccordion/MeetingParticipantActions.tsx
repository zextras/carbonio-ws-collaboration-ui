/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container, Tooltip, Icon, Padding, IconButton } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import MuteForAllModal from './MuteForAllModal';
import PromoteDemoteMemberAction from '../../../../chats/components/infoPanel/conversationParticipantsAccordion/PromoteDemoteMemberAction';
import useMuteForAll from '../../../../hooks/useMuteForAll';
import usePinnedTile from '../../../../hooks/usePinnedTile';
import {
	getParticipantAudioStatus,
	getRoomIdByMeetingId
} from '../../../../store/selectors/MeetingSelectors';
import { getOwnershipOfTheRoom, getOwner } from '../../../../store/selectors/RoomsSelectors';
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
	const iAmModeratorLabel: string = t('tooltip.iAmModerator', "You're a moderator");
	const participantMutedLabel = t('tooltip.participantMuted', 'This participant is muted');
	const youAreMutedLabel = t('tooltip.youAreAlreadyMuted', "You're muted");
	const muteForAllLabel = t('tooltip.muteForAll', 'Mute for all');
	const pinVideoLabel = t('tooltip.pinVideo', 'Pin video');
	const unpinVideoLabel = t('tooltip.unpinVideo', 'Unpin video');

	const userId: string | undefined = useStore((store) => getUserId(store));
	const roomId: string | undefined = useStore((store) =>
		getRoomIdByMeetingId(store, meetingId || '')
	);
	const participantAudioStatus = useStore((store) =>
		getParticipantAudioStatus(store, meetingId || '', memberId)
	);
	const memberOwner: boolean = useStore((store) => getOwner(store, roomId || '', memberId));
	const iAmOwner: boolean = useStore((state) => getOwnershipOfTheRoom(state, roomId || '', userId));

	const [muteForAllModalIsOpen, setMuteForAllModalIsOpen] = useState(false);

	const { isPinned, switchPinnedTile, canUsePinFeature } = usePinnedTile(meetingId || '', memberId);

	const isSessionParticipant: boolean = useMemo(() => memberId === userId, [memberId, userId]);

	const { muteForAllHasToAppear, muteForAll } = useMuteForAll(meetingId, memberId);

	const openMuteForAllModal = useCallback(() => {
		setMuteForAllModalIsOpen(true);
	}, []);

	const closeMuteForAllModal = useCallback(() => {
		setMuteForAllModalIsOpen(false);
	}, []);

	return (
		<Container width="fit" height="fit" orientation="horizontal">
			{iAmOwner && !isSessionParticipant ? (
				<PromoteDemoteMemberAction
					memberId={memberId}
					roomId={roomId || ''}
					owner={memberOwner}
					isInsideMeeting
				/>
			) : (
				memberOwner && (
					<Tooltip label={isSessionParticipant ? iAmModeratorLabel : memberIsModeratorLabel}>
						<Padding all="0.5rem">
							<Icon icon="Crown" size="medium" color="gray1" />
						</Padding>
					</Tooltip>
				)
			)}
			{!participantAudioStatus && (
				<Tooltip label={isSessionParticipant ? youAreMutedLabel : participantMutedLabel}>
					<Padding all="0.5rem">
						<Icon icon="MicOff" size="medium" color="gray1" />
					</Padding>
				</Tooltip>
			)}
			{muteForAllHasToAppear && (
				<Tooltip label={muteForAllLabel}>
					<IconButton
						iconColor="gray0"
						backgroundColor="text"
						icon="MicOffOutline"
						onClick={openMuteForAllModal}
						size="medium"
					/>
				</Tooltip>
			)}
			{canUsePinFeature && (
				<Tooltip label={isPinned ? unpinVideoLabel : pinVideoLabel}>
					<IconButton
						iconColor="gray0"
						backgroundColor="text"
						icon={isPinned ? 'Unpin3Outline' : 'Pin3Outline'}
						onClick={switchPinnedTile}
						size="large"
					/>
				</Tooltip>
			)}
			{muteForAllModalIsOpen && (
				<MuteForAllModal
					isOpen={muteForAllModalIsOpen}
					closeModal={closeMuteForAllModal}
					muteForAll={muteForAll}
				/>
			)}
		</Container>
	);
};

export default MeetingParticipantActions;
