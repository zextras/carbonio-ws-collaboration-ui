/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../../network';

type PromoteDemoteMemberProps = {
	owner: boolean;
	memberId: string;
	roomId: string;
	isInsideMeeting?: boolean;
};

const PromoteDemoteMemberAction: FC<PromoteDemoteMemberProps> = ({
	owner,
	memberId,
	roomId,
	isInsideMeeting
}) => {
	const [t] = useTranslation();
	const demoteModeratorLabel: string = t('tooltip.demoteModerator', 'Demote moderator');
	const promoteModeratorLabel: string = t('tooltip.promoteModerator', 'Promote to moderator');

	const tooltipLabel = owner ? demoteModeratorLabel : promoteModeratorLabel;

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
				backgroundColor={isInsideMeeting ? 'text' : 'gray6'}
				size={isInsideMeeting ? 'medium' : 'extralarge'}
				icon={owner ? 'Crown' : 'CrownOutline'}
				onClick={owner ? demoteMember : promoteMember}
			/>
		</Tooltip>
	);
};

export default PromoteDemoteMemberAction;
