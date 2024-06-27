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
	subDescription?: string;
	children: React.ReactNode;
};

const SettingsCard: FC<SettingsCardProps> = ({ title, description, subDescription, children }) => (
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
		{(description || subDescription) && (
			<Container gap="0.5rem" crossAlignment="flex-start">
				{description && (
					<Text overflow="break-word" size="small">
						{description}
					</Text>
				)}
				{subDescription && (
					<Text overflow="break-word" size="small" color="gray1" italic>
						{subDescription}
					</Text>
				)}
			</Container>
		)}
		{children}
	</Container>
);

export default SettingsCard;
