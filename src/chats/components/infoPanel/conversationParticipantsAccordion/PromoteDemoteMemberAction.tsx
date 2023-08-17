/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../../network';

type PromoteDemoteMemberProps = {
	isSessionParticipant: boolean;
	owner: boolean;
	memberId: string;
	roomId: string;
	isInsideMeeting?: boolean;
};

const PromoteDemoteMemberAction: FC<PromoteDemoteMemberProps> = ({
	isSessionParticipant,
	owner,
	memberId,
	roomId,
	isInsideMeeting
}) => {
	const [t] = useTranslation();
	const iAmModeratorLabel: string = t('tooltip.iAmModerator', "You're a moderator");
	const demoteModeratorLabel: string = t('tooltip.demoteModerator', 'Demote moderator');
	const promoteModeratorLabel: string = t('tooltip.promoteModerator', 'Promote to moderator');

	// eslint-disable-next-line no-nested-ternary
	const tooltipLabel = isSessionParticipant
		? iAmModeratorLabel
		: owner
		? demoteModeratorLabel
		: promoteModeratorLabel;

	const promoteMember = useCallback(
		() => RoomsApi.promoteRoomMember(roomId, memberId),
		[memberId, roomId]
	);

	const demoteMember = useCallback(
		() => RoomsApi.demotesRoomMember(roomId, memberId),
		[memberId, roomId]
	);

	return (
		<Tooltip label={tooltipLabel}>
			<IconButton
				iconColor={isInsideMeeting ? 'gray0' : owner ? 'primary' : 'secondary'}
				backgroundColor="gray6"
				size={isInsideMeeting ? 'large' : 'extralarge'}
				icon={owner ? 'Crown' : 'CrownOutline'}
				onClick={owner ? demoteMember : promoteMember}
				disabled={isSessionParticipant}
			/>
		</Tooltip>
	);
};

export default PromoteDemoteMemberAction;
