/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { Avatar, Container, Row, Text, Tooltip, useTheme } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRouting from '../../../../hooks/useRouting';
import { ContactMatch } from '../../../../network/soap/AutoCompleteRequest';
import useStore from '../../../../store/Store';
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
	contact: ContactMatch;
	expanded: boolean;
};

const GalListItem: React.FC<GalListItemProps> = ({ contact, expanded }) => {
	const [t] = useTranslation();
	const descriptionLabel = t(
		'participantsList.creationList.userDescription',
		'Click to create a chat with this user.'
	);

	const setPlaceholderRoom = useStore((state) => state.setPlaceholderRoom);

	const themeColor = useTheme();

	const { goToRoomPage } = useRouting();

	const username = useMemo(() => contact.fullName ?? contact.email ?? '', [contact]);

	const userColor = useMemo(() => {
		const color = calculateAvatarColor(username);
		return `${themeColor.avatarColors[color]}`;
	}, [username, themeColor.avatarColors]);

	const createPlaceholderRoom = useCallback(() => {
		const roomId = `placeholder-${contact.zimbraId}`;
		setPlaceholderRoom(contact.zimbraId);
		goToRoomPage(roomId);
	}, [contact.zimbraId, goToRoomPage, setPlaceholderRoom]);

	return (
		<ListItem
			onClick={createPlaceholderRoom}
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
						<Text size="small">{contact.fullName}</Text>
						<Container
							width="fill"
							height="fit"
							orientation="horizontal"
							mainAlignment="flex-start"
						>
							<Text color="secondary" size="extrasmall" overflow="ellipsis" data-testid="message">
								{descriptionLabel}
							</Text>
						</Container>
					</Row>
				</Row>
			)}
		</ListItem>
	);
};

export default GalListItem;
