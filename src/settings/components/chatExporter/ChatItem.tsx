/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Avatar, Container, Spinner, Text } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import {
	getRoomNameSelector,
	getRoomTypeSelector,
	getRoomURLPicture
} from '../../../store/selectors/RoomsSelectors';
import { getExportedChat } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';

const CustomContainer = styled(Container)`
	border-radius: 4px;
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
`;

type ChatItemProps = {
	roomId: string;
	onClick: () => void;
};

const ChatItem: React.FC<ChatItemProps> = ({ roomId, onClick }: ChatItemProps) => {
	const picture = useStore((state) => getRoomURLPicture(state, roomId));
	const roomName = useStore((store) => getRoomNameSelector(store, roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const exportedChat = useStore(getExportedChat);

	const message = 'last message'; // TODO

	return (
		<CustomContainer
			orientation="horizontal"
			onClick={onClick}
			padding={{ all: 'small' }}
			gap="0.5rem"
		>
			<Avatar
				label={roomName}
				picture={picture}
				shape={roomType === RoomType.ONE_TO_ONE ? 'round' : 'square'}
			/>
			<Container width="fill" crossAlignment="flex-start">
				<Text size="small">{roomName}</Text>
				<Text size="extrasmall" color="gray1">
					{message}
				</Text>
			</Container>
			{exportedChat === roomId && <Spinner color="gray1" />}
		</CustomContainer>
	);
};

export default ChatItem;
