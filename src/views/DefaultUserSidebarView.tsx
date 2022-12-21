/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const CustomText = styled(Text)`
	text-align: center;
`;

const DefaultUserSidebarView = (): ReactElement => {
	const [t] = useTranslation();
	const emptyListTitle = t('conversation.emptyListTitle', 'This list is empty');
	const emptyListDescription = t(
		'conversation.emptyListDescription',
		'The conversations and groups will appear listed here'
	);
	return (
		<Container mainAlignment="center" crossAlignment="center">
			<Container height="fit">
				<Text weight="bold" overflow="break-word" size="large" color="gray1">
					{emptyListTitle}
				</Text>
			</Container>
			<Padding bottom="small" />
			<Container height="fit" padding={{ left: 'large', right: 'large' }}>
				<CustomText overflow="break-word" size="small" color="gray1">
					{emptyListDescription}
				</CustomText>
			</Container>
		</Container>
	);
};

export default DefaultUserSidebarView;
