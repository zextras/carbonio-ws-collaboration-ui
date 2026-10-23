/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Dropdown,
	DropdownItem,
	Icon,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import MuteForAllModal from './MuteForAllModal';
import RemoveParticipantModal from './RemoveParticipantModal';
import useMuteForAll from '../../../../hooks/useMuteForAll';
import usePinnedTile from '../../../../hooks/usePinnedTile';
import { demotesRoomMember, promoteRoomMember } from '../../../../network';

type MeetingParticipantMoreActionsProps = {
	meetingId: string;
	roomId: string;
	memberId: string;
	isSessionParticipant: boolean;
	isMemberOwner: boolean;
	isUserGuest: boolean;
	iAmOwner: boolean;
};

const MeetingParticipantMoreActions: FC<MeetingParticipantMoreActionsProps> = ({
	meetingId,
	roomId,
	memberId,
	isSessionParticipant,
	isMemberOwner,
	isUserGuest,
	iAmOwner
}) => {
	const [t] = useTranslation();
	const moreActionsLabel = t('tooltip.moreActions', 'More actions');
	const promoteModeratorLabel = t('tooltip.promoteModerator', 'Promote to moderator');
	const demoteModeratorLabel = t('tooltip.demoteModerator', 'Demote moderator');
	const pinVideoLabel = t('tooltip.pinVideo', 'Pin video');
	const unpinVideoLabel = t('tooltip.unpinVideo', 'Unpin video');
	const muteForAllLabel = t('tooltip.muteForAll', 'Mute for all');
	const removeFromMeetingLabel = t('meeting.kick.action', 'Remove from meeting');

	const [muteForAllModalIsOpen, setMuteForAllModalIsOpen] = useState(false);
	const [removeModalIsOpen, setRemoveModalIsOpen] = useState(false);

	const { isPinned, switchPinnedTile, canUsePinFeature } = usePinnedTile(meetingId, memberId);
	const { muteForAllHasToAppear, muteForAll } = useMuteForAll(meetingId, memberId);

	const openMuteForAllModal = useCallback(() => setMuteForAllModalIsOpen(true), []);
	const closeMuteForAllModal = useCallback(() => setMuteForAllModalIsOpen(false), []);

	const openRemoveModal = useCallback(() => setRemoveModalIsOpen(true), []);
	const closeRemoveModal = useCallback(() => setRemoveModalIsOpen(false), []);

	const switchOwnership = useCallback(
		() =>
			isMemberOwner ? demotesRoomMember(roomId, memberId) : promoteRoomMember(roomId, memberId),
		[isMemberOwner, memberId, roomId]
	);

	const items: DropdownItem[] = useMemo(() => {
		const list: DropdownItem[] = [];
		if (canUsePinFeature) {
			list.push({
				id: 'switchPin',
				icon: isPinned ? 'Unpin3Outline' : 'Pin3Outline',
				label: isPinned ? unpinVideoLabel : pinVideoLabel,
				onClick: switchPinnedTile
			});
		}
		if (iAmOwner && !isSessionParticipant && !isUserGuest) {
			list.push({
				id: 'switchOwnership',
				icon: isMemberOwner ? 'Crown' : 'CrownOutline',
				label: isMemberOwner ? demoteModeratorLabel : promoteModeratorLabel,
				onClick: switchOwnership
			});
		}
		if (muteForAllHasToAppear) {
			list.push({
				id: 'muteForAll',
				icon: 'MicOffOutline',
				label: muteForAllLabel,
				onClick: openMuteForAllModal
			});
		}
		if (iAmOwner && !isSessionParticipant) {
			list.push({
				id: 'removeFromMeeting',
				onClick: openRemoveModal,
				customComponent: (
					<Container orientation="horizontal" mainAlignment="flex-start" gap="0.5rem" width="fill">
						<Icon icon="LogOutOutline" color="error" />
						<Text color="error">{removeFromMeetingLabel}</Text>
					</Container>
				)
			});
		}
		return list;
	}, [
		canUsePinFeature,
		demoteModeratorLabel,
		iAmOwner,
		isMemberOwner,
		isPinned,
		isSessionParticipant,
		isUserGuest,
		muteForAllHasToAppear,
		muteForAllLabel,
		openMuteForAllModal,
		openRemoveModal,
		pinVideoLabel,
		promoteModeratorLabel,
		removeFromMeetingLabel,
		switchOwnership,
		switchPinnedTile,
		unpinVideoLabel
	]);

	const hasActions = items.length > 0;

	return (
		<>
			{hasActions && (
				<Tooltip label={moreActionsLabel}>
					<Dropdown items={items} placement="bottom-end">
						<Button
							labelColor="gray0"
							backgroundColor="text"
							icon="MoreVertical"
							size="medium"
							onClick={(): null => null}
							data-testid="participant_more_actions"
						/>
					</Dropdown>
				</Tooltip>
			)}
			{muteForAllModalIsOpen && (
				<MuteForAllModal
					isOpen={muteForAllModalIsOpen}
					closeModal={closeMuteForAllModal}
					muteForAll={muteForAll}
				/>
			)}
			{removeModalIsOpen && (
				<RemoveParticipantModal
					meetingId={meetingId}
					memberId={memberId}
					closeModal={closeRemoveModal}
				/>
			)}
		</>
	);
};

export default MeetingParticipantMoreActions;
