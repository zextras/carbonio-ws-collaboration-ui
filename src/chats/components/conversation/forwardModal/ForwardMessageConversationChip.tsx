/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ComponentType, ReactElement } from 'react';

import { Chip, ChipItem } from '@zextras/carbonio-design-system';

import {
	getRoomNameSelector,
	getRoomTypeSelector,
	getRoomURLPicture
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

const ForwardMessageConversationChip: ComponentType<ChipItem<{ id: string }>> | undefined = (
	props
): ReactElement => {
	const roomName = useStore((state) => getRoomNameSelector(state, props.value?.id || ''));
	const picture = useStore((state) => getRoomURLPicture(state, props.value?.id || ''));
	const roomType = useStore((state) => getRoomTypeSelector(state, props.value?.id || ''));

	return (
		<Chip
			{...props}
			label={roomName}
			avatarPicture={picture}
			shape={roomType === RoomType.ONE_TO_ONE ? 'round' : 'regular'}
		/>
	);
};

export default ForwardMessageConversationChip;
