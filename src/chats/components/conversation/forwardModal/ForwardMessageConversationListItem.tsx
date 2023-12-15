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

const CustomContainer = styled(Container)<{ $parentWidth: number | undefined }>`
	width: ${({ $parentWidth }): string | 0 | undefined =>
		$parentWidth && `calc($parentWidth - 2rem);`};
`;

type ForwardModalConversationListItemProps = {
	roomId: string;
	selected: boolean;
	onClick: (id: string) => MouseEventHandler<HTMLDivElement> | undefined;
	modalRef: Element | undefined;
};
const ForwardMessageConversationListItem: FunctionComponent<
	ForwardModalConversationListItemProps
> = ({ roomId, selected, onClick, modalRef }) => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const picture: string | undefined = useStore((state) => getRoomURLPicture(state, roomId));
	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));

	console.log(modalRef?.clientWidth);

	return (
		<CustomContainer
			onClick={onClick(roomId)}
			orientation="horizontal"
			mainAlignment="flex-start"
			padding={{ vertical: 'small' }}
			$parentWidth={modalRef?.clientWidth}
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
			<Row mainAlignment="flex-start" takeAvailableSpace>
				<Text>{roomName}</Text>
			</Row>
			<Row />
		</CustomContainer>
	);
};

export default ForwardMessageConversationListItem;
