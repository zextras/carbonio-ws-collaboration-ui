/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import { Button, Tooltip } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRouting from '../../../../hooks/useRouting';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type GoToPrivateChatProps = {
	memberId: string;
	isParticipantMeeting?: boolean;
};

const CustomButton = styled(Button)<{ $isParticipantMeeting: boolean }>`
	background-color: rgba(255, 255, 255, 0);
	padding: ${({ $isParticipantMeeting }): string | false =>
		$isParticipantMeeting ? '0.438rem' : '0.75rem'};
	& > svg {
		width: 1.25rem;
		min-width: 1.25rem;
		height: 1.25rem;
		min-height: 1.25rem;
	}
`;

const GoToPrivateChatAction: FC<GoToPrivateChatProps> = ({ memberId, isParticipantMeeting }) => {
	const [t] = useTranslation();
	const goToPrivateChatLabel: string = t('tooltip.goToPrivateChat', 'Go to private chat');

	const setPlaceholderRoom = useStore((state) => state.setPlaceholderRoom);

	const { goToRoomPage } = useRouting();

	const goToUserRoom = useCallback(() => {
		const oneToOneChatExist = find(
			useStore.getState().rooms,
			(room) =>
				room.type === RoomType.ONE_TO_ONE &&
				!!find(room.members, (user) => user.userId === memberId)
		);
		const roomId = oneToOneChatExist?.id ?? `placeholder-${memberId}`;
		if (!oneToOneChatExist) setPlaceholderRoom(memberId);
		goToRoomPage(roomId);
	}, [goToRoomPage, memberId, setPlaceholderRoom]);

	return (
		<Tooltip label={goToPrivateChatLabel}>
			<CustomButton
				type="ghost"
				color="secondary"
				icon={'MessageCircleOutline'}
				onClick={goToUserRoom}
				data-testid="go_to_private_chat"
				$isParticipantMeeting={!!isParticipantMeeting}
			/>
		</Tooltip>
	);
};

export default GoToPrivateChatAction;
