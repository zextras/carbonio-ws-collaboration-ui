/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FunctionComponent } from 'react';

import {
	Avatar,
	Checkbox,
	Container,
	Padding,
	Row,
	TextWithTooltip
} from '@zextras/carbonio-design-system';

import { ChatListItemProp } from './ForwardMessageModal';
import {
	getRoomNameSelector,
	getRoomTypeSelector,
	getRoomURLPicture
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type ForwardModalConversationListItemProps = {
	item: ChatListItemProp;
	selected: boolean;
};

const ForwardMessageConversationListItem: FunctionComponent<
	ForwardModalConversationListItemProps
> = ({ item, selected }) => {
	const roomName = useStore((state) => getRoomNameSelector(state, item.id));
	const picture: string | undefined = useStore((state) => getRoomURLPicture(state, item.id));
	const roomType: string = useStore((state) => getRoomTypeSelector(state, item.id));

	return (
		<Container
			onClick={item.onClickCb(item.id)}
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
