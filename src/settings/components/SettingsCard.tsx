/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container, FormSection, FormSubSection, Text } from '@zextras/carbonio-design-system';

type SettingsCardProps = {
	title: string;
	description?: string;
	subDescription?: string;
	children: React.ReactNode;
};

const SettingsCard: FC<SettingsCardProps> = ({ title, description, subDescription, children }) => (
	<FormSection label={title}>
		{(description || subDescription) && (
			<FormSubSection>
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
			</FormSubSection>
		)}
		{children}
	</FormSection>
);

export default SettingsCard;
