/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FunctionComponent, MouseEventHandler } from 'react';

import {
	Avatar,
	Checkbox,
	Container,
	Padding,
	Row,
	TextWithTooltip
} from '@zextras/carbonio-design-system';

import {
	getRoomNameSelector,
	getRoomTypeSelector,
	getRoomURLPicture
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type ForwardModalConversationListItemProps = {
	roomId: string;
	selected: boolean;
	onClick: (id: string) => MouseEventHandler<HTMLDivElement> | undefined;
};

const ForwardMessageConversationListItem: FunctionComponent<
	ForwardModalConversationListItemProps
> = ({ roomId, selected, onClick }) => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const picture: string | undefined = useStore((state) => getRoomURLPicture(state, roomId));
	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));

	return (
		<Container
			onClick={onClick(roomId)}
			orientation="horizontal"
			mainAlignment="flex-start"
			padding={{ vertical: 'small' }}
			width="fill"
		>
			<Row>
				<Row>
					<Checkbox value={selected} />
					<Padding horizontal="small">
						<Avatar
							label={roomName}
							picture={picture}
							shape={roomType === RoomType.ONE_TO_ONE ? 'round' : 'square'}
						/>
					</Padding>
				</Row>
				<Row mainAlignment="flex-start" takeAvailableSpace wrap="nowrap">
					<Container width="fill" crossAlignment="flex-start">
						<TextWithTooltip>{roomName}</TextWithTooltip>
					</Container>
				</Row>
			</Row>
		</Container>
	);
};

export default ForwardMessageConversationListItem;
