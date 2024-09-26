/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement } from 'react';

import { Container, Text, Icon, Padding } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const CustomText = styled(Text)`
	text-align: center;
	max-width: 23.1875rem;
`;

const CustomIcon = styled(Icon)`
	height: 2.625rem;
	width: 2.625rem;
`;

const CustomIcon2 = styled(Icon)`
	height: 2rem;
	width: 2rem;
`;

type newUserViewProps = {
	roomsIds: string[];
};

const DefaultUserView: FC<newUserViewProps> = ({ roomsIds }): ReactElement => {
	const [t] = useTranslation();
	const createChatTitle = t(
		'conversation.emptyList.displayer.title',
		'Create a new chat using the create button'
	);
	const createChatDescription = t(
		'conversation.displayer.description',
		'Interact, communicate and collaborate with your colleagues by sharing information and attachments.'
	);

	const chooseAChatTitle = t(
		'conversation.displayer.title',
		'Choose a chat to start sending messages.'
	);

	const createChatOrGroupDescription = t(
		'conversation.emptyList.displayer.description',
		'When creating a chat you will have the possibility to choose more than one person and create a group.'
	);

	return (
		<Container mainAlignment="center" crossAlignment="center">
			<Container orientation="horizontal" height="fit">
				<CustomIcon2 icon="MessageCircleOutline" height="2rem" width="2rem" color="gray1" />
				<Padding right="large" />
				<CustomIcon icon="MessageSquareOutline" color="gray1" />
				<Padding right="large" />
				<CustomIcon2 icon="VideoOutline" height="2rem" width="2rem" color="gray1" />
			</Container>
			<Padding bottom="small" />
			<Container height="fit">
				<CustomText weight="bold" overflow="break-word" size="large" color="gray1">
					{roomsIds.length !== 0 ? chooseAChatTitle : createChatTitle}
				</CustomText>
			</Container>
			<Padding bottom="small" />
			<Container height="fit">
				<CustomText overflow="break-word" size="small" color="gray1">
					{roomsIds.length !== 0 ? createChatDescription : createChatOrGroupDescription}
				</CustomText>
			</Container>
			<Padding bottom="large" />
		</Container>
	);
};

export default DefaultUserView;
