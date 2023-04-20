/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Chip } from '@zextras/carbonio-design-system';
import React, { FunctionComponent, ReactElement } from 'react';

import {
	getRoomNameSelector,
	getRoomTypeSelector,
	getRoomURLPicture
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

const ForwardMessageConversationChip: FunctionComponent<{ id: string }> = (props): ReactElement => {
	const roomName = useStore((state) => getRoomNameSelector(state, props.id));
	const picture: string | undefined = useStore((state) => getRoomURLPicture(state, props.id));
	const roomType: string = useStore((state) => getRoomTypeSelector(state, props.id));

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
