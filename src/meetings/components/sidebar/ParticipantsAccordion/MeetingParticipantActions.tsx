/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container, Tooltip, Icon, Padding, Button } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import MeetingParticipantMoreActions from './MeetingParticipantMoreActions';
import MuteForAllModal from './MuteForAllModal';
import useMuteForAll from '../../../../hooks/useMuteForAll';
import {
	getParticipantAudioStatus,
	getRoomIdByMeetingId
} from '../../../../store/selectors/MeetingSelectors';
import { getOwnershipOfTheRoom } from '../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { getIsUserGuest } from '../../../../store/selectors/UsersSelectors';
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

	const userId: string | undefined = useStore((store) => getUserId(store));
	const roomId: string | undefined = useStore((store) =>
		getRoomIdByMeetingId(store, meetingId ?? '')
	);
	const participantAudioStatus = useStore((store) =>
		getParticipantAudioStatus(store, meetingId ?? '', memberId)
	);
	const isMemberOwner: boolean = useStore((store) =>
		getOwnershipOfTheRoom(store, roomId ?? '', memberId)
	);
	const isUserGuest = useStore((store) => getIsUserGuest(store, memberId));
	const iAmOwner: boolean = useStore((state) => getOwnershipOfTheRoom(state, roomId ?? '', userId));

	const [muteForAllModalIsOpen, setMuteForAllModalIsOpen] = useState(false);

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
			{isMemberOwner && (
				<Tooltip label={isSessionParticipant ? iAmModeratorLabel : memberIsModeratorLabel}>
					<Padding all="0.5rem">
						<Icon icon="Crown" size="medium" color="gray1" />
					</Padding>
				</Tooltip>
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
					<Button
						labelColor="gray0"
						backgroundColor="text"
						icon="MicOffOutline"
						onClick={openMuteForAllModal}
						size="medium"
					/>
				</Tooltip>
			)}
			<MeetingParticipantMoreActions
				meetingId={meetingId ?? ''}
				roomId={roomId ?? ''}
				memberId={memberId}
				isSessionParticipant={isSessionParticipant}
				isMemberOwner={isMemberOwner}
				isUserGuest={!!isUserGuest}
				iAmOwner={iAmOwner}
			/>
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
