/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FunctionComponent, MouseEventHandler } from 'react';

import { Avatar, Checkbox, Container, Padding, Row, Text } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import {
	getRoomNameSelector,
	getRoomTypeSelector,
	getRoomURLPicture
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

const CustomRow = styled(Row)`
	overflow-x: hidden;
	text-overflow: ellipsis;
	width: calc(100%);
`;

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
		<Padding vertical="small">
			<Container
				onClick={onClick(roomId)}
				orientation="horizontal"
				mainAlignment="flex-start"
				width="26.75rem"
			>
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
				<CustomRow mainAlignment="flex-start" takeAvailableSpace>
					<Text>{roomName}</Text>
				</CustomRow>
			</Container>
		</Padding>
	);
};

export default ForwardMessageConversationListItem;
