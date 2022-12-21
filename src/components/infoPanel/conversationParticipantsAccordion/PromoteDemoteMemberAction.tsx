/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../network';
import useStore from '../../../store/Store';

type PromoteDemoteMemberProps = {
	isSessionParticipant: boolean;
	owner: boolean;
	memberId: string;
	roomId: string;
};

const PromoteDemoteMemberAction: FC<PromoteDemoteMemberProps> = ({
	isSessionParticipant,
	owner,
	memberId,
	roomId
}) => {
	const [t] = useTranslation();
	const iAmModeratorLabel: string = t('tooltip.iAmModerator', "You're a moderator");
	const demoteModeratorLabel: string = t('tooltip.demoteModerator', 'Demote moderator');
	const promoteModeratorLabel: string = t('tooltip.promoteModerator', 'Promote to moderator');
	const promoteMemberToModerator = useStore((state) => state.promoteMemberToModerator);
	const demoteMemberFromModerator = useStore((state) => state.demoteMemberFromModerator);
	// eslint-disable-next-line no-nested-ternary
	const tooltipLabel = isSessionParticipant
		? iAmModeratorLabel
		: owner
		? demoteModeratorLabel
		: promoteModeratorLabel;

	const promoteMember = useCallback(() => {
		RoomsApi.promoteRoomMember(roomId, memberId)
			.then(() => promoteMemberToModerator(roomId, memberId))
			.catch(() => null);
	}, [memberId, promoteMemberToModerator, roomId]);

	const demoteMember = useCallback(() => {
		RoomsApi.demotesRoomMember(roomId, memberId)
			.then(() => demoteMemberFromModerator(roomId, memberId))
			.catch(() => null);
	}, [demoteMemberFromModerator, memberId, roomId]);

	return (
		<Tooltip label={tooltipLabel}>
			<IconButton
				iconColor={owner ? 'primary' : 'secondary'}
				size="extralarge"
				icon={owner ? 'Crown' : 'CrownOutline'}
				onClick={owner ? demoteMember : promoteMember}
				disabled={isSessionParticipant}
			/>
		</Tooltip>
	);
};

export default PromoteDemoteMemberAction;
