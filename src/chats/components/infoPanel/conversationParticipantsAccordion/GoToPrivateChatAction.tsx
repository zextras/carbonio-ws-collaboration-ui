/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import useRouting from '../../../../hooks/useRouting';
import { RoomsApi } from '../../../../network';
import useStore from '../../../../store/Store';
import { AddRoomResponse } from '../../../../types/network/responses/roomsResponses';
import { RoomType } from '../../../../types/store/RoomTypes';

type GoToPrivateChatProps = {
	memberId: string;
	isParticipantMeeting?: boolean;
};

const GoToPrivateChatAction: FC<GoToPrivateChatProps> = ({ memberId, isParticipantMeeting }) => {
	const [t] = useTranslation();
	const goToPrivateChatLabel: string = t('tooltip.goToPrivateChat', 'Go to private chat');

	const { goToRoomPage } = useRouting();

	const goToUserRoom = useCallback(() => {
		const oneToOneChatExist = find(
			useStore.getState().rooms,
			(room) =>
				room.type === RoomType.ONE_TO_ONE &&
				!!find(room.members, (user) => user.userId === memberId)
		);
		if (oneToOneChatExist) {
			goToRoomPage(oneToOneChatExist.id);
		} else {
			RoomsApi.addRoom({
				type: RoomType.ONE_TO_ONE,
				membersIds: [memberId]
			}).then((response: AddRoomResponse) => goToRoomPage(response.id));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [memberId]);

	return (
		<Tooltip label={goToPrivateChatLabel}>
			<IconButton
				iconColor="secondary"
				customSize={{
					iconSize: '1.25rem',
					paddingSize: isParticipantMeeting ? '0.438rem' : '0.75rem'
				}}
				icon={'MessageCircleOutline'}
				onClick={goToUserRoom}
				data-testid="go_to_private_chat"
			/>
		</Tooltip>
	);
};

export default GoToPrivateChatAction;
