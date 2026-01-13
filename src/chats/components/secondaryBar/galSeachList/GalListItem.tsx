/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Avatar, Container, Row, Text, Tooltip, useTheme } from '@zextras/carbonio-design-system';
import { find } from 'lodash';

import useRouting from '../../../../hooks/useRouting';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { ContactInfo } from '../../../../types/network/soap/searchUsersByFeatureRequest'
import { calculateAvatarColor } from '../../../../utils/styleUtils';

const ListItem = styled(Container)`
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray3.regular};
	}
	-webkit-user-select: none;
	user-select: none;
`;

type GalListItemProps = {
	contact: ContactInfo;
	expanded: boolean;
};

const GalListItem: React.FC<GalListItemProps> = ({ contact, expanded }) => {
	const rooms = useStore((state) => state.rooms);
	const setPlaceholderRoom = useStore((state) => state.setPlaceholderRoom);

	const themeColor = useTheme();

	const { goToRoomPage } = useRouting();

	const username = useMemo(() => contact.displayName ?? contact.email ?? '', [contact]);

	const userColor = useMemo(() => {
		const color = calculateAvatarColor(username);
		return `${themeColor.avatarColors[color]}`;
	}, [username, themeColor.avatarColors]);

	const openOrCreateRoom = useCallback(() => {
		// Check if a one-to-one chat already exists with this user
		const existingRoom = find(
			rooms,
			(room) =>
				room.type === RoomType.ONE_TO_ONE &&
				!!find(room.members, (member) => member.userId === contact.id)
		);

		if (existingRoom) {
			goToRoomPage(existingRoom.id);
		} else {
			// Create placeholder room and navigate to it
			setPlaceholderRoom(contact.id);
			goToRoomPage(`placeholder-${contact.id}`);
		}
	}, [contact.id, goToRoomPage, rooms, setPlaceholderRoom]);

	return (
		<ListItem
			onClick={openOrCreateRoom}
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			padding={{ all: 'small' }}
			data-testid="gal_list_item"
		>
			<Row>
				<Tooltip label={username}>
					<Avatar
						data-testid={`${username}-avatar`}
						label={username}
						shape="round"
						background={userColor}
					/>
				</Tooltip>
			</Row>
			{expanded && (
				<Row
					takeAvailableSpace
					crossAlignment="flex-start"
					width="fill"
					padding={{ left: 'small' }}
					orientation="horizontal"
				>
					<Row takeAvailableSpace crossAlignment="flex-start" orientation="vertical">
						<Text size="small">{contact.displayName}</Text>
						<Container
							width="fill"
							height="fit"
							orientation="horizontal"
							mainAlignment="flex-start"
						>
							<Text color="secondary" size="extrasmall" overflow="ellipsis" data-testid="message">
								{contact.email}
							</Text>
						</Container>
					</Row>
				</Row>
			)}
		</ListItem>
	);
};

export default GalListItem;
