/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';

type SettingsCardProps = {
	title: string;
	description?: string;
	children: React.ReactNode;
};

const SettingsCard: FC<SettingsCardProps> = ({ title, description, children }) => (
	<Container
		background={'gray6'}
		padding={{ horizontal: 'medium', bottom: 'medium' }}
		crossAlignment="flex-start"
		gap="1rem"
	>
		<Padding top="large">
			<Text weight="bold">{title}</Text>
		</Padding>
		<Divider color="gray2" />
		{description && (
			<Text overflow="break-word" size={'small'}>
				{description}
			</Text>
		)}
		{children}
	</Container>
);

export default SettingsCard;
